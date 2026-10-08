from django.urls import path

from .views import (
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminProductDetailView,
    AdminProductImageView,
    AdminProductListCreateView,
    CategoryListView,
    ProductCustomizationView,
    ProductDetailView,
    ProductListView,
)

urlpatterns = [
    path("categories", CategoryListView.as_view()),
    path("products", ProductListView.as_view()),
    path("products/<int:pk>", ProductDetailView.as_view()),
    path("products/<int:pk>/customizations", ProductCustomizationView.as_view()),
    path("admin/categories", AdminCategoryListCreateView.as_view()),
    path("admin/categories/<int:pk>", AdminCategoryDetailView.as_view()),
    path("admin/products", AdminProductListCreateView.as_view()),
    path("admin/products/<int:pk>", AdminProductDetailView.as_view()),
    path("admin/products/<int:pk>/image", AdminProductImageView.as_view()),
]
