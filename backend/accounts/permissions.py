from rest_framework.permissions import BasePermission


class IsStaffOrAdmin(BasePermission):
    message = "Staff access is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in ("staff", "admin"))


class IsAdminRole(BasePermission):
    message = "Admin access is required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == "admin")
