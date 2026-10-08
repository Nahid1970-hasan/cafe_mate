from django.contrib import admin

from .models import Category, CustomizationGroup, CustomizationOption, Product


class OptionInline(admin.TabularInline):
    model = CustomizationOption
    extra = 0


class GroupInline(admin.TabularInline):
    model = CustomizationGroup
    extra = 0
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "is_active", "is_featured")
    list_filter = ("category", "is_active", "is_featured")
    search_fields = ("name",)
    inlines = [GroupInline]


@admin.register(CustomizationGroup)
class CustomizationGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "product", "input_type", "is_required", "is_active")
    inlines = [OptionInline]
