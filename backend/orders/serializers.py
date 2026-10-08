from decimal import Decimal

from rest_framework import serializers

from .models import Order, OrderItem, OrderItemCustomization


class OrderItemCustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItemCustomization
        fields = ["id", "option_name", "option_value", "extra_price"]


class OrderItemSerializer(serializers.ModelSerializer):
    customizations = OrderItemCustomizationSerializer(many=True, read_only=True)
    charged_unit_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "quantity",
            "unit_price",
            "charged_unit_price",
            "total_price",
            "special_instruction",
            "customizations",
        ]

    def get_charged_unit_price(self, obj):
        extras = sum((item.extra_price for item in obj.customizations.all()), Decimal("0.00"))
        return obj.unit_price + extras


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "total_amount",
            "special_instruction",
            "created_at",
            "updated_at",
            "customer_name",
            "items",
        ]

    def get_customer_name(self, obj):
        return obj.customer.full_name


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(
        min_value=1,
        max_value=99,
        error_messages={
            "min_value": "Quantity must be greater than zero.",
            "max_value": "Quantity must be 99 or less.",
            "invalid": "Quantity must be greater than zero.",
        },
    )
    special_instruction = serializers.CharField(required=False, allow_blank=True, max_length=250)
    option_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, allow_empty=True
    )


class OrderCreateSerializer(serializers.Serializer):
    special_instruction = serializers.CharField(required=False, allow_blank=True, max_length=250)
    items = OrderItemInputSerializer(many=True, allow_empty=False)
