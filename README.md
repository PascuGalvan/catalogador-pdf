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


Algunas Capturas



![image](https://github.com/user-attachments/assets/77c87202-c115-488e-b6b6-539f3431b7c7)




![2025-04-10 02_22_00-Subir Documento PDF](https://github.com/user-attachments/assets/d68e5285-a7f0-4302-b108-e8fabd1c0d7f)



![2025-04-10 02_32_05-Buscar Sentencias](https://github.com/user-attachments/assets/932a2c22-f797-4769-96d8-cccbbc96f536)



