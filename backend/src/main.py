import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db
from src.models.farmacia import Farmacia
from src.models.inventario import Inventario
from src.models.cliente import Cliente
from src.models.venta import Venta, VentaDetalle
from src.models.proveedor import Proveedor, ListaPrecioProveedor
from src.models.lista_proveedor import ListaProveedor
from src.routes.user import user_bp
from src.routes.farmacia import farmacia_bp
from src.routes.inventario import inventario_bp
from src.routes.lista_comparativa import lista_comparativa_bp
from src.routes.proveedor import proveedor_bp
from src.routes.reportes import reportes_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(farmacia_bp, url_prefix='/api')
app.register_blueprint(inventario_bp, url_prefix='/api')
app.register_blueprint(lista_comparativa_bp, url_prefix='/api')
app.register_blueprint(proveedor_bp, url_prefix='/api')
app.register_blueprint(reportes_bp, url_prefix='/api')

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
