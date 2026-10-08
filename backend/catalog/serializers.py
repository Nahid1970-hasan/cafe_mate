from decimal import Decimal

from rest_framework import serializers

from .models import Category, CustomizationGroup, CustomizationOption, Product


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "emoji"]


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "emoji", "sort_order", "is_active", "product_count"]


class CategoryWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    emoji = serializers.CharField(max_length=8, required=False, allow_blank=True)
    sort_order = serializers.IntegerField(required=False, min_value=0)
    is_active = serializers.BooleanField(required=False)


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizationOption
        fields = ["id", "value", "extra_price", "is_active", "sort_order"]


class GroupSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = CustomizationGroup
        fields = ["id", "name", "input_type", "is_required", "is_active", "sort_order", "options"]


class ProductSerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "ingredients",
            "price",
            "image",
            "preparation_time",
            "is_active",
            "is_featured",
            "category",
        ]

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            url = obj.image.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return obj.image_url or ""


class AdminProductSerializer(ProductSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    category_id = serializers.IntegerField(source="category.id", read_only=True)
    image_url = serializers.CharField(read_only=True)

    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ["groups", "category_id", "image_url"]


class OptionWriteSerializer(serializers.Serializer):
    value = serializers.CharField(max_length=80, allow_blank=True)
    extra_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, default=Decimal("0.00")
    )
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_extra_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Extra price cannot be negative.")
        return value


class GroupWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    input_type = serializers.ChoiceField(choices=["single", "multiple"])
    is_required = serializers.BooleanField(required=False, default=False)
    is_active = serializers.BooleanField(required=False, default=True)
    options = OptionWriteSerializer(many=True)


class ProductWriteSerializer(serializers.Serializer):
    category_id = serializers.IntegerField(required=False)
    name = serializers.CharField(max_length=120, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    ingredients = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    image_url = serializers.URLField(required=False, allow_blank=True)
    preparation_time = serializers.IntegerField(required=False, min_value=1, max_value=180)
    is_active = serializers.BooleanField(required=False)
    is_featured = serializers.BooleanField(required=False)
    groups = GroupWriteSerializer(many=True, required=False)

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate(self, attrs):
        if not self.partial:
            missing = [field for field in ("category_id", "name", "price") if field not in attrs]
            if missing:
                raise serializers.ValidationError("Category, name, and price are required.")
        return attrs
