from django.db import IntegrityError, transaction
from django.utils.text import slugify
from rest_framework.exceptions import ValidationError

from .models import Category, CustomizationGroup, CustomizationOption, Product


def create_category(data):
    name = data["name"].strip()
    base = slugify(name) or "category"
    slug = base
    number = 2
    while Category.objects.filter(slug=slug).exists():
        slug = f"{base}-{number}"
        number += 1
    try:
        return Category.objects.create(
            name=name,
            slug=slug,
            emoji=(data.get("emoji") or "").strip(),
            sort_order=data.get("sort_order", 0),
            is_active=data.get("is_active", True),
        )
    except IntegrityError as exc:
        raise ValidationError("A category with this name already exists.") from exc


def update_category(category, data):
    if "name" in data:
        category.name = data["name"].strip()
    if "emoji" in data:
        category.emoji = (data.get("emoji") or "").strip()
    if "sort_order" in data:
        category.sort_order = data["sort_order"]
    if "is_active" in data:
        category.is_active = data["is_active"]
    try:
        category.save()
    except IntegrityError as exc:
        raise ValidationError("A category with this name already exists.") from exc
    return category


def replace_groups(product, groups):
    product.groups.all().delete()
    for index, group in enumerate(groups):
        name = group["name"].strip()
        cleaned = []
        for option in group.get("options") or []:
            value = str(option.get("value", "")).strip()
            if value:
                cleaned.append((value, option))
        if not cleaned:
            raise ValidationError(f"Add at least one option for {name}.")
        created = CustomizationGroup.objects.create(
            product=product,
            name=name,
            input_type=group["input_type"],
            is_required=group.get("is_required", False),
            is_active=group.get("is_active", True),
            sort_order=index,
        )
        CustomizationOption.objects.bulk_create(
            [
                CustomizationOption(
                    group=created,
                    value=value,
                    extra_price=option.get("extra_price") or 0,
                    is_active=option.get("is_active", True),
                    sort_order=option_index,
                )
                for option_index, (value, option) in enumerate(cleaned)
            ]
        )


def create_product(data):
    with transaction.atomic():
        try:
            product = Product.objects.create(
                category_id=data["category_id"],
                name=data["name"].strip(),
                description=data.get("description", ""),
                ingredients=data.get("ingredients", ""),
                price=data["price"],
                image_url=data.get("image_url", ""),
                preparation_time=data.get("preparation_time", 5),
                is_active=data.get("is_active", True),
                is_featured=data.get("is_featured", False),
            )
        except IntegrityError as exc:
            raise ValidationError("A product with this name already exists in that category.") from exc
        if data.get("groups"):
            replace_groups(product, data["groups"])
        return product


def update_product(product, data):
    with transaction.atomic():
        if "category_id" in data:
            product.category_id = data["category_id"]
        if "name" in data:
            product.name = data["name"].strip()
        for field in (
            "description",
            "ingredients",
            "price",
            "image_url",
            "preparation_time",
            "is_active",
            "is_featured",
        ):
            if field in data:
                setattr(product, field, data[field])
        try:
            product.save()
        except IntegrityError as exc:
            raise ValidationError("A product with this name already exists in that category.") from exc
        if "groups" in data:
            replace_groups(product, data["groups"])
        return product
