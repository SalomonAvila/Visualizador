// Ejemplos precargados organizados por los temas del curso

export const EXAMPLES = [
  {
    id: 'intro_variables',
    category: '1. Variables y Primitivos',
    title: 'Intercambio de Variables y Tipos Básicos',
    description: 'Demuestra variables primitivas (int, float, char, bool, string) y cómo intercambiar dos valores con una variable auxiliar.',
    code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    // Declaración de tipos primitivos y string
    int a = 15;
    int b = 40;
    float pi = 3.1416;
    char letra = 'C';
    bool activo = true;
    string curso = "Intro a la Programacion";

    cout << "Valores iniciales: a = " << a << ", b = " << b << endl;

    // Intercambio de valores usando variable temporal
    int temp = a;
    a = b;
    b = temp;

    cout << "Valores intercambiados: a = " << a << ", b = " << b << endl;
    cout << "Curso: " << curso << " (Letra: " << letra << ")" << endl;

    return 0;
}`
  },

  {
    id: 'ciclos_for_while',
    category: '2. Ciclos y Control',
    title: 'Ciclos for, while y do-while',
    description: 'Compara el funcionamiento paso a paso de los tres ciclos principales de C++.',
    code: `#include <iostream>
using namespace std;

int main() {
    cout << "--- 1. Ciclo FOR: Tabla del 5 ---" << endl;
    for (int i = 1; i <= 5; i++) {
        int resultado = 5 * i;
        cout << "5 x " << i << " = " << resultado << endl;
    }

    cout << "--- 2. Ciclo WHILE: Suma de numeros ---" << endl;
    int suma = 0;
    int contador = 1;
    while (contador <= 4) {
        suma += contador;
        contador++;
    }
    cout << "Suma total acumulada: " << suma << endl;

    cout << "--- 3. Ciclo DO-WHILE: Al menos una vez ---" << endl;
    int num = 10;
    do {
        cout << "Valor de num: " << num << endl;
        num += 10;
    } while (num <= 25);

    return 0;
}`
  },

  {
    id: 'arreglos_1d',
    category: '3. Arreglos 1D',
    title: 'Arreglos 1D: Búsqueda del Mayor y Promedio',
    description: 'Declara un arreglo de 6 elementos, lo recorre con un ciclo for para calcular la suma, el promedio y encontrar el valor mayor y su posición.',
    code: `#include <iostream>
using namespace std;

int main() {
    int notas[6] = {14, 18, 11, 20, 16, 15};
    int suma = 0;
    int mayor = notas[0];
    int posMayor = 0;

    for (int i = 0; i < 6; i++) {
        suma += notas[i];

        if (notas[i] > mayor) {
            mayor = notas[i];
            posMayor = i;
        }
    }

    int promedio = suma / 6;

    cout << "Suma total: " << suma << endl;
    cout << "Promedio: " << promedio << endl;
    cout << "Mayor nota: " << mayor << " en la posicion [" << posMayor << "]" << endl;

    return 0;
}`
  },

  {
    id: 'matrices_2d',
    category: '4. Matrices 2D',
    title: 'Matrices 2D: Recorrido y Suma por Filas',
    description: 'Visualiza una matriz de 3x3, recorriéndola con dos ciclos for anidados (fila y columna).',
    code: `#include <iostream>
using namespace std;

int main() {
    int matriz[3][3] = {
        {10, 20, 30},
        {5,  15, 25},
        {8,  12, 16}
    };

    cout << "Recorriendo matriz 3x3:" << endl;
    for (int f = 0; f < 3; f++) {
        int sumaFila = 0;
        for (int c = 0; c < 3; c++) {
            sumaFila += matriz[f][c];
            cout << matriz[f][c] << " ";
        }
        cout << "| Suma fila " << f << ": " << sumaFila << endl;
    }

    return 0;
}`
  },

  {
    id: 'funciones_basicas',
    category: '5. Funciones',
    title: 'Funciones con Retorno y Parámetros',
    description: 'Muestra cómo se crean funciones con retorno entero y void, y cómo la pila de llamadas gestiona los parámetros.',
    code: `#include <iostream>
using namespace std;

// Función con retorno entero
int calcularPotencia(int base, int exponente) {
    int resultado = 1;
    for (int i = 0; i < exponente; i++) {
        resultado *= base;
    }
    return resultado;
}

// Función con tipo de retorno void
void mostrarMensaje(string usuario, int nivel) {
    cout << "Bienvenido " << usuario << ", Nivel: " << nivel << endl;
}

int main() {
    mostrarMensaje("Carlos", 2);

    int pot1 = calcularPotencia(2, 4);
    cout << "2 elevado a la 4 es: " << pot1 << endl;

    int pot2 = calcularPotencia(5, 3);
    cout << "5 elevado a la 3 es: " << pot2 << endl;

    return 0;
}`
  },

  {
    id: 'structs_registros',
    category: '6. Structs',
    title: 'Estructuras y Arreglos de Structs',
    description: 'Define un struct Alumno y crea un arreglo de structs para gestionar varios registros y calcular el mejor promedio.',
    code: `#include <iostream>
#include <string>
using namespace std;

struct Alumno {
    string nombre;
    int edad;
    float calificacion;
};

int main() {
    Alumno lista[3];

    // Llenando datos del primer alumno
    lista[0].nombre = "Lucia";
    lista[0].edad = 19;
    lista[0].calificacion = 9.4;

    // Segundo alumno
    lista[1].nombre = "Mateo";
    lista[1].edad = 20;
    lista[1].calificacion = 8.7;

    // Tercer alumno
    lista[2].nombre = "Valeria";
    lista[2].edad = 18;
    lista[2].calificacion = 9.8;

    float mejorNota = lista[0].calificacion;
    string mejorAlumno = lista[0].nombre;

    for (int i = 1; i < 3; i++) {
        if (lista[i].calificacion > mejorNota) {
            mejorNota = lista[i].calificacion;
            mejorAlumno = lista[i].nombre;
        }
    }

    cout << "El mejor alumno es: " << mejorAlumno << " con calificacion: " << mejorNota << endl;
    return 0;
}`
  },

  {
    id: 'archivos_fstream_csv',
    category: '7. Archivos (fstream)',
    title: 'Lectura CSV con getline por comas y atoi',
    description: 'Abre el archivo "estudiantes.csv", lee cada línea separando campos con getline(archivo, token, \',\') y convierte las calificaciones numéricas con atoi.',
    code: `#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
using namespace std;

int main() {
    ifstream archivo("estudiantes.csv");
    ofstream reporte("reporte_alumnos.txt");

    if (!archivo.is_open()) {
        cout << "Error: No se pudo abrir el archivo." << endl;
        return 1;
    }

    string nombre;
    string edadStr;
    string notaStr;
    int totalAlumnos = 0;
    int sumaNotas = 0;

    cout << "--- Procesando estudiantes.csv ---" << endl;

    // Lectura delimitada por comas
    while (getline(archivo, nombre, ',')) {
        getline(archivo, edadStr, ',');
        getline(archivo, notaStr); // Lee hasta el salto de linea

        int edad = atoi(edadStr.c_str());
        int nota = atoi(notaStr.c_str());

        sumaNotas += nota;
        totalAlumnos++;

        cout << "Leido: " << nombre << " | Edad: " << edad << " | Nota: " << nota << endl;

        // Escribir en archivo de salida
        reporte << nombre << " tiene calificacion: " << nota << endl;
    }

    archivo.close();
    reporte.close();

    int promedio = sumaNotas / totalAlumnos;
    cout << "Total procesados: " << totalAlumnos << endl;
    cout << "Promedio del grupo: " << promedio << endl;
    cout << "Reporte guardado en reporte_alumnos.txt" << endl;

    return 0;
}`
  }
];
