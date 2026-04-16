"""Utility helpers"""


def paginate(query_result, page=1, per_page=20):
    """Simple pagination helper."""
    start = (page - 1) * per_page
    end = start + per_page
    items = query_result[start:end]
    return {
        'items': items,
        'page': page,
        'per_page': per_page,
        'total': len(query_result),
        'pages': (len(query_result) + per_page - 1) // per_page,
    }


def format_response(data, message='Success', status=200):
    """Standard API response format."""
    return {
        'status': 'ok' if status < 400 else 'error',
        'message': message,
        'data': data,
    }, status
