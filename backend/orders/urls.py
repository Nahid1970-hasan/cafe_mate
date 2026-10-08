from django.urls import path

from .views import (
    DashboardOrderActionView,
    DashboardOrderDetailView,
    DashboardOrderListView,
    DashboardSummaryView,
    OrderDetailView,
    OrderListCreateView,
)

urlpatterns = [
    path("orders", OrderListCreateView.as_view()),
    path("orders/<int:pk>", OrderDetailView.as_view()),
    path("dashboard/summary", DashboardSummaryView.as_view()),
    path("dashboard/orders", DashboardOrderListView.as_view()),
    path("dashboard/orders/<int:pk>", DashboardOrderDetailView.as_view()),
    path("dashboard/orders/<int:pk>/accept", DashboardOrderActionView.as_view(action_name="accept")),
    path(
        "dashboard/orders/<int:pk>/preparing",
        DashboardOrderActionView.as_view(action_name="preparing"),
    ),
    path("dashboard/orders/<int:pk>/ready", DashboardOrderActionView.as_view(action_name="ready")),
    path(
        "dashboard/orders/<int:pk>/complete",
        DashboardOrderActionView.as_view(action_name="complete"),
    ),
]
