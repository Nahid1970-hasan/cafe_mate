from django.conf import settings
from django.db import models


class OrderSequence(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    last_number = models.PositiveIntegerField(default=1024)

    class Meta:
        db_table = "order_sequence"


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "NEW", "New"
        ACCEPTED = "ACCEPTED", "Accepted"
        PREPARING = "PREPARING", "Preparing"
        READY = "READY", "Ready"
        COMPLETED = "COMPLETED", "Completed"

    order_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="orders", on_delete=models.PROTECT
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_instruction = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("catalog.Product", related_name="order_items", on_delete=models.PROTECT)
    product_name = models.CharField(max_length=120)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    special_instruction = models.CharField(max_length=250, blank=True)

    class Meta:
        db_table = "order_items"

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"


class OrderItemCustomization(models.Model):
    order_item = models.ForeignKey(OrderItem, related_name="customizations", on_delete=models.CASCADE)
    option_name = models.CharField(max_length=80)
    option_value = models.CharField(max_length=80)
    extra_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = "order_item_customizations"

    def __str__(self):
        return f"{self.option_name}: {self.option_value}"
