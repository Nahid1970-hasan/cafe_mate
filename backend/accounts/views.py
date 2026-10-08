from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminRole
from .serializers import (
    CafeTokenObtainPairSerializer,
    RegisterSerializer,
    StaffCreateSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CafeTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["full_name"] = user.full_name
        return Response(
            {
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=201,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class StaffUserListCreateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        users = User.objects.order_by("role", "username")
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=201)


class StaffUserDetailView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        user = User.objects.filter(pk=pk).first()
        if user is None:
            return Response({"detail": "User not found."}, status=404)
        if user.id == request.user.id and request.data.get("is_active") is False:
            return Response({"detail": "You cannot disable your own account."}, status=400)

        if "is_active" in request.data:
            user.is_active = bool(request.data.get("is_active"))
        if "role" in request.data:
            role = request.data.get("role")
            if role not in (User.Role.CUSTOMER, User.Role.STAFF, User.Role.ADMIN):
                return Response({"detail": "Invalid role."}, status=400)
            if user.id == request.user.id and role != User.Role.ADMIN:
                return Response({"detail": "You cannot change your own admin role."}, status=400)
            user.role = role
            user.is_staff = role in (User.Role.STAFF, User.Role.ADMIN)
            user.is_superuser = role == User.Role.ADMIN
        user.save()
        return Response(UserSerializer(user).data)
