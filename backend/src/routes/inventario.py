@inventario_bp.route('/ventas/summary', methods=['GET'])
def get_sales_summary():
    try:
        pipeline = [
            {
                '$group': {
                    '_id': None, # Group all documents
                    'total_ventas': {'$sum': '$total'},
                    'total_items': {'$sum': {'$sum': '$items.cantidad'}} # Sum quantities of all items in all sales
                }
            },
            {
                '$project': {
                    '_id': 0,
                    'total_ventas': 1,
                    'total_items': 1
                }
            }
        ]
        summary = list(mongo.db.ventas.aggregate(pipeline))
        if summary:
            return jsonify(summary[0])
        else:
            return jsonify({'total_ventas': 0, 'total_items': 0})
    except Exception as e:
        return jsonify({'error': str(e)}), 500