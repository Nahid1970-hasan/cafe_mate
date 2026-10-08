TEA_GROUPS = [
    {
        "name": "Sugar",
        "input_type": "single",
        "is_required": True,
        "options": [
            ("No Sugar", 0),
            ("1 Spoon", 0),
            ("2 Spoons", 0),
            ("3 Spoons", 0),
            ("4 Spoons", 0),
            ("Custom", 0),
        ],
    },
    {
        "name": "Milk",
        "input_type": "single",
        "is_required": True,
        "options": [("No Milk", 0), ("Less", 0), ("Normal", 0), ("Extra", 5)],
    },
    {
        "name": "Tea Strength",
        "input_type": "single",
        "is_required": True,
        "options": [("Light", 0), ("Normal", 0), ("Strong", 0), ("Extra Strong", 0)],
    },
    {
        "name": "Temperature",
        "input_type": "single",
        "is_required": True,
        "options": [("Very Hot", 0), ("Hot", 0), ("Warm", 0)],
    },
    {
        "name": "Extras",
        "input_type": "multiple",
        "is_required": False,
        "options": [("Ginger", 5), ("Cardamom", 5), ("Lemon", 5), ("Honey", 10)],
    },
]

COFFEE_GROUPS = [
    {
        "name": "Sugar",
        "input_type": "single",
        "is_required": True,
        "options": [("No Sugar", 0), ("1 Spoon", 0), ("2 Spoons", 0), ("3 Spoons", 0)],
    },
    {
        "name": "Milk",
        "input_type": "single",
        "is_required": True,
        "options": [("No Milk", 0), ("Less", 0), ("Normal", 0), ("Extra", 5)],
    },
    {
        "name": "Coffee Strength",
        "input_type": "single",
        "is_required": True,
        "options": [("Light", 0), ("Normal", 0), ("Strong", 0), ("Extra Strong", 0)],
    },
    {
        "name": "Temperature",
        "input_type": "single",
        "is_required": True,
        "options": [("Hot", 0), ("Warm", 0), ("Iced", 0)],
    },
    {
        "name": "Extras",
        "input_type": "multiple",
        "is_required": False,
        "options": [("Extra Coffee", 15), ("Whipped Cream", 20), ("Chocolate", 10), ("Caramel", 10)],
    },
]

SNACK_GROUPS = [
    {
        "name": "Bread",
        "input_type": "single",
        "is_required": True,
        "options": [("White", 0), ("Brown", 0)],
    },
    {
        "name": "Cheese",
        "input_type": "single",
        "is_required": True,
        "options": [("No Cheese", 0), ("Cheese", 10)],
    },
    {
        "name": "Sauce",
        "input_type": "single",
        "is_required": True,
        "options": [("Mayo", 0), ("Tomato", 0), ("Chili", 0), ("BBQ", 0)],
    },
    {
        "name": "Spicy Level",
        "input_type": "single",
        "is_required": True,
        "options": [("None", 0), ("Mild", 0), ("Medium", 0), ("Hot", 0)],
    },
    {
        "name": "Extras",
        "input_type": "multiple",
        "is_required": False,
        "options": [("Extra Chicken", 30), ("Extra Cheese", 15)],
    },
]

SIMPLE_SNACK_GROUPS = [
    {
        "name": "Spicy Level",
        "input_type": "single",
        "is_required": True,
        "options": [("None", 0), ("Mild", 0), ("Medium", 0), ("Hot", 0)],
    },
    {
        "name": "Sauce",
        "input_type": "single",
        "is_required": False,
        "options": [("Mayo", 0), ("Tomato", 0), ("Chili", 0), ("BBQ", 0)],
    },
]

BAKERY_GROUPS = [
    {
        "name": "Serve",
        "input_type": "single",
        "is_required": False,
        "options": [("Room Temperature", 0), ("Warmed", 0)],
    }
]

DRINK_GROUPS = [
    {
        "name": "Sugar",
        "input_type": "single",
        "is_required": True,
        "options": [("No Sugar", 0), ("Less", 0), ("Normal", 0), ("Extra", 0)],
    },
    {
        "name": "Ice",
        "input_type": "single",
        "is_required": True,
        "options": [("No Ice", 0), ("Normal", 0), ("Extra", 0)],
    },
]

MENU = [
    {
        "name": "Tea",
        "emoji": "🍵",
        "products": [
            ("Milk Tea", 20, 5, True, "Classic milk tea brewed to order.", "Tea leaves, milk, sugar", TEA_GROUPS),
            ("Black Tea", 15, 4, False, "Strong black tea without milk.", "Tea leaves", TEA_GROUPS),
            ("Lemon Tea", 25, 5, False, "Bright tea with lemon.", "Tea leaves, lemon", TEA_GROUPS),
            ("Green Tea", 30, 5, False, "Light green tea.", "Green tea leaves", TEA_GROUPS),
            ("Ginger Tea", 25, 6, False, "Tea simmered with fresh ginger.", "Tea leaves, ginger, milk", TEA_GROUPS),
        ],
    },
    {
        "name": "Coffee",
        "emoji": "☕",
        "products": [
            ("Coffee", 40, 6, False, "Freshly brewed coffee.", "Coffee, water", COFFEE_GROUPS),
            ("Cappuccino", 80, 7, True, "Espresso with steamed milk and foam.", "Espresso, milk", COFFEE_GROUPS),
            ("Latte", 90, 7, False, "Smooth espresso with extra milk.", "Espresso, milk", COFFEE_GROUPS),
            ("Cold Coffee", 70, 6, True, "Chilled coffee blended with milk.", "Coffee, milk, ice", COFFEE_GROUPS),
            ("Black Coffee", 35, 5, False, "Straight black coffee.", "Coffee, water", COFFEE_GROUPS),
        ],
    },
    {
        "name": "Snacks",
        "emoji": "🥪",
        "products": [
            ("Samosa", 15, 8, False, "Crispy potato samosa.", "Potato, spices, pastry", SIMPLE_SNACK_GROUPS),
            ("Singara", 15, 8, False, "Golden fried singara.", "Potato, spices, pastry", SIMPLE_SNACK_GROUPS),
            (
                "Chicken Sandwich",
                60,
                10,
                True,
                "Grilled chicken sandwich with your choice of bread and sauce.",
                "Chicken, bread, sauce",
                SNACK_GROUPS,
            ),
            (
                "Chicken Burger",
                120,
                12,
                True,
                "Chicken burger with cheese and sauce options.",
                "Chicken, bun, sauce",
                SNACK_GROUPS,
            ),
            ("Fries", 50, 8, False, "Crispy salted fries.", "Potato, salt", SIMPLE_SNACK_GROUPS),
            ("Nuggets", 90, 10, False, "Crispy chicken nuggets.", "Chicken, coating", SIMPLE_SNACK_GROUPS),
        ],
    },
    {
        "name": "Bakery",
        "emoji": "🍩",
        "products": [
            ("Cake", 80, 2, False, "Slice of fresh cake.", "Flour, sugar, butter", BAKERY_GROUPS),
            ("Muffin", 45, 2, False, "Soft bakery muffin.", "Flour, egg, sugar", BAKERY_GROUPS),
            ("Biscuit", 20, 1, False, "Crunchy tea biscuit.", "Flour, butter, sugar", BAKERY_GROUPS),
            ("Donut", 40, 2, True, "Glazed donut.", "Flour, sugar, glaze", BAKERY_GROUPS),
        ],
    },
    {
        "name": "Drinks",
        "emoji": "🥤",
        "products": [
            ("Soft Drink", 30, 1, False, "Chilled bottled soft drink.", "Carbonated drink", DRINK_GROUPS),
            ("Milkshake", 90, 6, False, "Thick milkshake.", "Milk, ice cream", DRINK_GROUPS),
            ("Juice", 50, 4, False, "Fresh fruit juice.", "Fruit", DRINK_GROUPS),
        ],
    },
]
