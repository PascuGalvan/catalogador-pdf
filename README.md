CATALOGADOR PDF

Cataloga archivos pdfs con cabeceras descriptivas de su contenido o campos extraibles, almacena el pdf en una ruta local,  almacena en la bbdd mysql los campos requeridos y la ruta donde se encuentra el archivo local
Los archivos pueden ser cargados individualmente o seleccion multiple, la primera opción puede añadir observaciones sobre el documente en la bbdd
Una vez que tenemos una biblioteca de documentos almacenados tenemos una opcion de busqueda tanto en la bbdd como en la biblioteca de archivos local.

CONFIGURACIÓN

Array de campos a extraer del documento

// server.js

const campos = ['campo1', 'campo2', 'campo3'];

Dirección de la bbdd y credenciales, la bbdd se crea automaticamente si no existiera.

 host: 'localhost',
 
  user: 'root',
  
  password: ''


REQUISITOS

Node.js

Mysql

Requerimientos en package.json, instalar via "npm install"

INSTALACIóN

Clonar el repositorio git clone https://github.com/PascuGalvan/catalogador-pdf.git

cd catalogador-pdf

npm install

node server.js

http://localhost:3002


Capturas



![image](https://github.com/user-attachments/assets/77c87202-c115-488e-b6b6-539f3431b7c7)




![2025-04-11 01_01_35-Subir Documento PDF](https://github.com/user-attachments/assets/cb0cf12b-5280-45df-8d21-0415ca0a1c95)




![2025-04-11 01_00_56-Buscar Sentencias](https://github.com/user-attachments/assets/64a5290f-50e7-4b8a-8beb-95b967f87d42)

