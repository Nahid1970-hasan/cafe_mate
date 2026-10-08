import copy
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from catalog.models import Category, CustomizationGroup, CustomizationOption, Product
from catalog.seed_data import MENU

DEMO_USERS = [
    {
        "username": "nahid",
        "password": "nahid123",
        "first_name": "Nahid",
        "last_name": "Hasan",
        "role": "customer",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "username": "staff",
        "password": "staff123",
        "first_name": "Cafe",
        "last_name": "Staff",
        "role": "staff",
        "is_staff": True,
        "is_superuser": False,
    },
    {
        "username": "admin",
        "password": "admin123",
        "first_name": "Cafe",
        "last_name": "Admin",
        "role": "admin",
        "is_staff": True,
        "is_superuser": True,
    },
]


class Command(BaseCommand):
    help = "Load CafeMate categories, products, customization options, and demo users."

    def handle(self, *args, **options):
        for index, category_data in enumerate(MENU, start=1):
            category, _created = Category.objects.get_or_create(
                name=category_data["name"],
                defaults={"slug": slugify(category_data["name"]), "emoji": category_data["emoji"], "sort_order": index},
            )
            category.emoji = category_data["emoji"]
            category.sort_order = index
            category.is_active = True
            category.save()

            for product_index, product_data in enumerate(category_data["products"], start=1):
                name, price, prep, featured, description, ingredients, groups = product_data
                product, created = Product.objects.get_or_create(
                    category=category,
                    name=name,
                    defaults={
                        "price": Decimal(price),
                        "preparation_time": prep,
                        "is_featured": featured,
                        "description": description,
                        "ingredients": ingredients,
                        "sort_order": product_index,
                    },
                )
                product.price = Decimal(price)
                product.preparation_time = prep
                product.is_featured = featured
                product.description = description
                product.ingredients = ingredients
                product.sort_order = product_index
                product.is_active = True
                product.save()
                if created or not product.groups.exists():
                    self._add_groups(product, groups)

        User = get_user_model()
        for item in DEMO_USERS:
            user, _created = User.objects.get_or_create(username=item["username"])
            user.first_name = item["first_name"]
            user.last_name = item["last_name"]
            user.role = item["role"]
            user.is_staff = item["is_staff"]
            user.is_superuser = item["is_superuser"]
            user.is_active = True
            user.set_password(item["password"])
            user.save()

        self.stdout.write(self.style.SUCCESS("CafeMate demo data is ready."))
        self.stdout.write("Customer  nahid / nahid123")
        self.stdout.write("Staff     staff / staff123")
        self.stdout.write("Admin     admin / admin123")

    def _add_groups(self, product, groups):
        for index, group_data in enumerate(copy.deepcopy(groups)):
            group = CustomizationGroup.objects.create(
                product=product,
                name=group_data["name"],
                input_type=group_data["input_type"],
                is_required=group_data["is_required"],
                sort_order=index,
            )
            CustomizationOption.objects.bulk_create(
                [
                    CustomizationOption(
                        group=group,
                        value=value,
                        extra_price=Decimal(price),
                        sort_order=option_index,
                    )
                    for option_index, (value, price) in enumerate(group_data["options"])
                ]
            )
