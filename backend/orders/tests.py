from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from catalog.models import Category, CustomizationGroup, CustomizationOption, Product


class CafeMateFlowTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.customer = user_model.objects.create_user(
            username="nahid",
            password="nahid123",
            first_name="Nahid",
            last_name="Hasan",
            role="customer",
        )
        self.staff = user_model.objects.create_user(
            username="staff",
            password="staff123",
            role="staff",
        )
        category = Category.objects.create(name="Tea", slug="tea", emoji="🍵")
        self.product = Product.objects.create(
            category=category,
            name="Milk Tea",
            price=Decimal("20.00"),
            preparation_time=5,
            is_active=True,
            is_featured=True,
        )
        self.hidden = Product.objects.create(
            category=category,
            name="Hidden Tea",
            price=Decimal("10.00"),
            is_active=False,
        )
        self.sugar = self._group("Sugar", 1, [("2 Spoons", 0)])
        self.milk = self._group("Milk", 2, [("Extra", 5)])
        self.strength = self._group("Tea Strength", 3, [("Strong", 0)])
        self.temperature = self._group("Temperature", 4, [("Hot", 0)])
        self.ginger = self._group("Extras", 5, [("Ginger", 5)], input_type="multiple", required=False)

    def _group(self, name, sort_order, options, input_type="single", required=True):
        group = CustomizationGroup.objects.create(
            product=self.product,
            name=name,
            input_type=input_type,
            is_required=required,
            sort_order=sort_order,
        )
        created = []
        for index, (value, price) in enumerate(options):
            created.append(
                CustomizationOption.objects.create(
                    group=group,
                    value=value,
                    extra_price=Decimal(price),
                    sort_order=index,
                )
            )
        return created[0]

    def auth(self, username, password):
        response = self.client.post(
            "/api/auth/login",
            {"username": username, "password": password},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")

    def place_order(self, option_ids=None, quantity=2, product_id=None):
        return self.client.post(
            "/api/orders",
            {
                "special_instruction": "Call when ready",
                "items": [
                    {
                        "product_id": product_id or self.product.id,
                        "quantity": quantity,
                        "special_instruction": "Slightly less hot",
                        "option_ids": option_ids
                        if option_ids is not None
                        else [
                            self.sugar.id,
                            self.milk.id,
                            self.strength.id,
                            self.temperature.id,
                            self.ginger.id,
                        ],
                    }
                ],
            },
            format="json",
        )

    def test_server_calculates_price_and_staff_can_complete_order(self):
        self.auth("nahid", "nahid123")
        response = self.place_order()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["order_number"], "CAF-1025")
        self.assertEqual(response.data["status"], "NEW")
        self.assertEqual(response.data["total_amount"], "60.00")
        self.assertEqual(response.data["customer_name"], "Nahid Hasan")
        item = response.data["items"][0]
        self.assertEqual(item["unit_price"], "20.00")
        self.assertEqual(item["charged_unit_price"], "30.00")
        self.assertEqual(item["total_price"], "60.00")
        self.assertEqual(item["customizations"][0]["option_name"], "Sugar")
        order_id = response.data["id"]

        self.auth("staff", "staff123")
        summary = self.client.get("/api/dashboard/summary")
        self.assertEqual(summary.status_code, 200)
        self.assertEqual(summary.data["new"], 1)
        self.assertEqual(summary.data["today_total"], 1)

        for action, status in (
            ("accept", "ACCEPTED"),
            ("preparing", "PREPARING"),
            ("ready", "READY"),
            ("complete", "COMPLETED"),
        ):
            moved = self.client.put(f"/api/dashboard/orders/{order_id}/{action}")
            self.assertEqual(moved.status_code, 200, moved.data)
            self.assertEqual(moved.data["status"], status)

        self.auth("nahid", "nahid123")
        detail = self.client.get(f"/api/orders/{order_id}")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["status"], "COMPLETED")

    def test_required_customization_quantity_and_inactive_product_are_rejected(self):
        self.auth("nahid", "nahid123")
        missing = self.place_order(option_ids=[self.milk.id, self.strength.id, self.temperature.id])
        self.assertEqual(missing.status_code, 400)
        self.assertIn("Sugar", missing.data["detail"])

        zero = self.place_order(quantity=0)
        self.assertEqual(zero.status_code, 400)
        self.assertIn("Quantity", zero.data["detail"])

        inactive = self.place_order(product_id=self.hidden.id, option_ids=[])
        self.assertEqual(inactive.status_code, 400)
        self.assertIn("Inactive", inactive.data["detail"])

        products = self.client.get("/api/products")
        names = [product["name"] for product in products.data]
        self.assertIn("Milk Tea", names)
        self.assertNotIn("Hidden Tea", names)

    def test_customer_cannot_change_dashboard_status(self):
        self.auth("nahid", "nahid123")
        created = self.place_order()
        order_id = created.data["id"]
        denied = self.client.put(f"/api/dashboard/orders/{order_id}/accept")
        self.assertEqual(denied.status_code, 403)

        self.auth("staff", "staff123")
        too_soon = self.client.put(f"/api/dashboard/orders/{order_id}/complete")
        self.assertEqual(too_soon.status_code, 400)

    def test_register_creates_customer(self):
        response = self.client.post(
            "/api/auth/register",
            {
                "username": "rupa",
                "password": "rupa12345",
                "first_name": "Rupa",
                "last_name": "Karim",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["user"]["role"], "customer")
        self.assertEqual(response.data["user"]["full_name"], "Rupa Karim")
        self.assertTrue(response.data["access"])
