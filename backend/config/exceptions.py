from rest_framework.views import exception_handler


def _flatten(data):
    if data is None:
        return "Request failed."
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        parts = [_flatten(item) for item in data if item not in (None, "", [])]
        return " ".join(part for part in parts if part) or "Request failed."
    if isinstance(data, dict):
        if set(data.keys()) == {"detail"}:
            return _flatten(data["detail"])
        parts = []
        for key, value in data.items():
            message = _flatten(value)
            if not message:
                continue
            if key in ("detail", "non_field_errors"):
                parts.append(message)
            else:
                parts.append(message)
        return " ".join(parts) or "Request failed."
    return str(data)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None
    response.data = {"detail": _flatten(response.data)}
    return response
