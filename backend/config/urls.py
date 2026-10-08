from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

from accounts.views import StaffUserDetailView, StaffUserListCreateView

admin.site.site_header = "CafeMate"
admin.site.site_title = "CafeMate"
admin.site.index_title = "Cafe administration"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", TemplateView.as_view(template_name="dashboard/index.html"), name="dashboard"),
    path("api/auth/", include("accounts.urls")),
    path("api/admin/users", StaffUserListCreateView.as_view()),
    path("api/admin/users/<int:pk>", StaffUserDetailView.as_view()),
    path("api/", include("catalog.urls")),
    path("api/", include("orders.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
