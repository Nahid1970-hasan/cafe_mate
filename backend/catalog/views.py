from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

from .models import Category, CustomizationGroup, CustomizationOption, Product
from .serializers import (
    AdminProductSerializer,
    CategorySerializer,
    CategoryWriteSerializer,
    GroupSerializer,
    ProductSerializer,
    ProductWriteSerializer,
)
from .services import create_category, create_product, update_category, update_product


def public_products():
    return Product.objects.filter(is_active=True, category__is_active=True).select_related("category")


def admin_products():
    return Product.objects.select_related("category").prefetch_related("groups__options")


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.filter(is_active=True).annotate(
            product_count=Count("products", filter=Q(products__is_active=True))
        )
        return Response(CategorySerializer(categories, many=True).data)


class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        products = public_products()
        category = request.query_params.get("category")
        if category:
            if category.isdigit():
                products = products.filter(category_id=category)
            else:
                products = products.filter(category__slug=category)
        search = (request.query_params.get("search") or "").strip()
        if search:
            products = products.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if request.query_params.get("featured") in ("1", "true", "True"):
            products = products.filter(is_featured=True)
        return Response(ProductSerializer(products, many=True, context={"request": request}).data)


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        product = public_products().filter(pk=pk).first()
        if product is None:
            return Response({"detail": "This product is not available."}, status=404)
        return Response(ProductSerializer(product, context={"request": request}).data)


class ProductCustomizationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        product = public_products().filter(pk=pk).first()
        if product is None:
            return Response({"detail": "This product is not available."}, status=404)
        groups = CustomizationGroup.objects.filter(product=product, is_active=True).prefetch_related(
            Prefetch("options", queryset=CustomizationOption.objects.filter(is_active=True))
        )
        return Response(
            {
                "product_id": product.id,
                "groups": GroupSerializer(groups, many=True).data,
            }
        )


class AdminCategoryListCreateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        categories = Category.objects.annotate(product_count=Count("products"))
        return Response(CategorySerializer(categories, many=True).data)

    def post(self, request):
        serializer = CategoryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = create_category(serializer.validated_data)
        category.product_count = 0
        return Response(CategorySerializer(category).data, status=201)


class AdminCategoryDetailView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        category = get_object_or_404(Category, pk=pk)
        serializer = CategoryWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        category = update_category(category, serializer.validated_data)
        category.product_count = category.products.count()
        return Response(CategorySerializer(category).data)


class AdminProductListCreateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response(
            AdminProductSerializer(admin_products(), many=True, context={"request": request}).data
        )

    def post(self, request):
        serializer = ProductWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self._ensure_category(serializer.validated_data.get("category_id"))
        product = create_product(serializer.validated_data)
        product = admin_products().get(pk=product.pk)
        return Response(AdminProductSerializer(product, context={"request": request}).data, status=201)

    def _ensure_category(self, category_id):
        if not Category.objects.filter(pk=category_id).exists():
            raise ValidationError("Category not found.")


class AdminProductDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        product = get_object_or_404(admin_products(), pk=pk)
        return Response(AdminProductSerializer(product, context={"request": request}).data)

    def patch(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        serializer = ProductWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if "category_id" in serializer.validated_data and not Category.objects.filter(
            pk=serializer.validated_data["category_id"]
        ).exists():
            raise ValidationError("Category not found.")
        update_product(product, serializer.validated_data)
        product = admin_products().get(pk=product.pk)
        return Response(AdminProductSerializer(product, context={"request": request}).data)


class AdminProductImageView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        product = get_object_or_404(Product, pk=pk)
        image = request.FILES.get("image")
        if image is None:
            raise ValidationError("Choose an image.")
        if image.size > 5 * 1024 * 1024:
            raise ValidationError("Image must be 5 MB or smaller.")
        product.image = image
        product.save(update_fields=["image", "updated_at"])
        product = admin_products().get(pk=product.pk)
        return Response(AdminProductSerializer(product, context={"request": request}).data)
