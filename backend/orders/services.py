from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import NotFound, ValidationError

from catalog.models import CustomizationGroup, CustomizationOption, Product

from .models import Order, OrderItem, OrderItemCustomization, OrderSequence

TRANSITIONS = {
    "accept": (Order.Status.NEW, Order.Status.ACCEPTED),
    "preparing": (Order.Status.ACCEPTED, Order.Status.PREPARING),
    "ready": (Order.Status.PREPARING, Order.Status.READY),
    "complete": (Order.Status.READY, Order.Status.COMPLETED),
}


def allocate_order_number():
    OrderSequence.objects.get_or_create(pk=1, defaults={"last_number": 1024})
    sequence = OrderSequence.objects.select_for_update().get(pk=1)
    sequence.last_number += 1
    sequence.save(update_fields=["last_number"])
    return f"CAF-{sequence.last_number}"


def create_order(*, customer, items, special_instruction=""):
    note = (special_instruction or "").strip()
    if not items:
        raise ValidationError("Add at least one product.")

    with transaction.atomic():
        order = Order.objects.create(
            order_number=allocate_order_number(),
            customer=customer,
            status=Order.Status.NEW,
            total_amount=Decimal("0.00"),
            special_instruction=note,
        )
        grand_total = Decimal("0.00")
        for raw in items:
            grand_total += _add_item(order, raw)
        order.total_amount = grand_total
        order.save(update_fields=["total_amount", "updated_at"])
        return order


def _add_item(order, raw):
    try:
        product = Product.objects.select_related("category").get(pk=raw["product_id"])
    except Product.DoesNotExist as exc:
        raise ValidationError("One of the selected products is not available.") from exc
    if not product.is_active or not product.category.is_active:
        raise ValidationError("Inactive products cannot be ordered.")

    item_note = (raw.get("special_instruction") or "").strip()
    option_ids = list(dict.fromkeys(raw.get("option_ids") or []))
    options = list(
        CustomizationOption.objects.filter(
            id__in=option_ids,
            is_active=True,
            group__is_active=True,
            group__product=product,
        ).select_related("group")
    )
    if len(options) != len(option_ids):
        raise ValidationError("A selected customization is invalid or inactive.")

    options.sort(key=lambda option: (option.group.sort_order, option.sort_order, option.id))
    chosen = {}
    for option in options:
        chosen.setdefault(option.group_id, []).append(option)

    groups = CustomizationGroup.objects.filter(product=product, is_active=True)
    for group in groups:
        picks = chosen.get(group.id, [])
        if group.input_type == CustomizationGroup.InputType.SINGLE:
            if len(picks) > 1:
                raise ValidationError(f"Choose only one option for {group.name}.")
            if group.is_required and len(picks) != 1:
                raise ValidationError(f"Please choose {group.name}.")
        elif group.is_required and not picks:
            raise ValidationError(f"Please choose {group.name}.")

    extras = sum((option.extra_price for option in options), Decimal("0.00"))
    total_price = (product.price + extras) * raw["quantity"]
    item = OrderItem.objects.create(
        order=order,
        product=product,
        product_name=product.name,
        quantity=raw["quantity"],
        unit_price=product.price,
        total_price=total_price,
        special_instruction=item_note,
    )
    OrderItemCustomization.objects.bulk_create(
        [
            OrderItemCustomization(
                order_item=item,
                option_name=option.group.name,
                option_value=option.value,
                extra_price=option.extra_price,
            )
            for option in options
        ]
    )
    return total_price


def transition_order(order_id, action):
    if action not in TRANSITIONS:
        raise ValidationError("Unknown order action.")
    expected, new_status = TRANSITIONS[action]
    with transaction.atomic():
        try:
            order = Order.objects.select_for_update().get(pk=order_id)
        except Order.DoesNotExist as exc:
            raise NotFound("Order not found.") from exc
        if order.status != expected:
            raise ValidationError(f"This order is {order.status} and cannot move to {new_status} yet.")
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
        return order
