from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=80, unique=True)
    emoji = models.CharField(max_length=8, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "categories"
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, related_name="products", on_delete=models.PROTECT)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    ingredients = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    image_url = models.URLField(blank=True)
    preparation_time = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        ordering = ["sort_order", "name"]
        constraints = [
            models.UniqueConstraint(fields=["category", "name"], name="unique_product_name_per_category")
        ]

    def __str__(self):
        return self.name


class CustomizationGroup(models.Model):
    class InputType(models.TextChoices):
        SINGLE = "single", "Single"
        MULTIPLE = "multiple", "Multiple"

    product = models.ForeignKey(Product, related_name="groups", on_delete=models.CASCADE)
    name = models.CharField(max_length=80)
    input_type = models.CharField(max_length=20, choices=InputType.choices, default=InputType.SINGLE)
    is_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "customization_groups"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.product.name} / {self.name}"


class CustomizationOption(models.Model):
    group = models.ForeignKey(CustomizationGroup, related_name="options", on_delete=models.CASCADE)
    value = models.CharField(max_length=80)
    extra_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "customization_options"
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.value
