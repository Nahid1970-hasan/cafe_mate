from datetime import datetime

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsStaffOrAdmin

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer
from .services import create_order, transition_order


def order_queryset():
    return Order.objects.select_related("customer").prefetch_related("items__customizations")


class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = order_queryset().filter(customer=request.user)
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = create_order(
            customer=request.user,
            items=serializer.validated_data["items"],
            special_instruction=serializer.validated_data.get("special_instruction", ""),
        )
        order = order_queryset().get(pk=order.pk)
        return Response(OrderSerializer(order).data, status=201)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(order_queryset().filter(customer=request.user), pk=pk)
        return Response(OrderSerializer(order).data)


class DashboardSummaryView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        today = timezone.localdate()
        rows = (
            Order.objects.filter(created_at__date=today)
            .values("status")
            .annotate(total=Count("id"))
        )
        counts = {row["status"]: row["total"] for row in rows}
        return Response(
            {
                "date": today.isoformat(),
                "today_total": sum(counts.values()),
                "new": counts.get(Order.Status.NEW, 0),
                "accepted": counts.get(Order.Status.ACCEPTED, 0),
                "preparing": counts.get(Order.Status.PREPARING, 0),
                "ready": counts.get(Order.Status.READY, 0),
                "completed": counts.get(Order.Status.COMPLETED, 0),
            }
        )


class DashboardOrderListView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request):
        orders = order_queryset()
        status = request.query_params.get("status")
        if status:
            if status not in Order.Status.values:
                raise ValidationError("Invalid status.")
            orders = orders.filter(status=status)
        term = (request.query_params.get("search") or "").strip()
        if term:
            orders = orders.filter(
                Q(order_number__icontains=term)
                | Q(customer__username__icontains=term)
                | Q(customer__first_name__icontains=term)
                | Q(customer__last_name__icontains=term)
            )
        if request.query_params.get("today") in ("1", "true", "True"):
            orders = orders.filter(created_at__date=timezone.localdate())
        day = request.query_params.get("date")
        if day:
            try:
                parsed = datetime.strptime(day, "%Y-%m-%d").date()
            except ValueError as exc:
                raise ValidationError("Invalid date.") from exc
            orders = orders.filter(created_at__date=parsed)
        return Response(OrderSerializer(orders.order_by("-created_at")[:200], many=True).data)


class DashboardOrderDetailView(APIView):
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, pk):
        order = get_object_or_404(order_queryset(), pk=pk)
        return Response(OrderSerializer(order).data)


class DashboardOrderActionView(APIView):
    permission_classes = [IsStaffOrAdmin]
    action_name = None

    def put(self, request, pk):
        transition_order(pk, self.action_name)
        order = order_queryset().get(pk=pk)
        return Response(OrderSerializer(order).data)
