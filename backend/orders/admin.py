from django.contrib import admin

from .models import Order, OrderItem, OrderItemCustomization


class CustomizationInline(admin.TabularInline):
    model = OrderItemCustomization
    extra = 0


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    show_change_link = True


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "customer", "status", "total_amount", "created_at")
    list_filter = ("status",)
    search_fields = ("order_number", "customer__username", "customer__first_name", "customer__last_name")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("product_name", "order", "quantity", "total_price")
    inlines = [CustomizationInline]
