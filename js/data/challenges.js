// Retos de práctica para estudiantes con autoevaluación

export const CHALLENGES = [
  {
    id: 'reto_ciclos',
    title: 'Reto 1: Contador de Pares con Ciclos',
    category: 'Ciclos',
    difficulty: 'Fácil',
    prompt: 'Escribe un programa que recorra los números del 1 al 10 usando un ciclo for. Cuenta cuántos números son pares (usando el operador %) y muestra el total al final.',
    initialCode: `#include <iostream>
using namespace std;

int main() {
    int pares = 0;

    // TODO: Usa un ciclo for del 1 al 10
    // Si num % 2 == 0, incrementa pares
    for (int i = 1; i <= 10; i++) {
        if (i % 2 == 0) {
            pares++;
        }
    }

    cout << "Total de pares: " << pares << endl;
    return 0;
}`,
    expectedOutput: 'Total de pares: 5',
    hint: 'Usa `if (i % 2 == 0)` dentro del ciclo for.'
  },

  {
    id: 'reto_arreglos',
    title: 'Reto 2: Mínimo en un Arreglo 1D',
    category: 'Arreglos 1D',
    difficulty: 'Fácil',
    prompt: 'Dado el arreglo de 5 números enteros {35, 12, 88, 7, 24}, encuentra el valor menor y guárdalo en la variable "menor". Imprime el resultado en consola.',
    initialCode: `#include <iostream>
using namespace std;

int main() {
    int datos[5] = {35, 12, 88, 7, 24};
    int menor = datos[0];

    // TODO: Recorre el arreglo desde el indice 1 al 4
    for (int i = 1; i < 5; i++) {
        if (datos[i] < menor) {
            menor = datos[i];
        }
    }

    cout << "El menor valor es: " << menor << endl;
    return 0;
}`,
    expectedOutput: 'El menor valor es: 7',
    hint: 'Compara `datos[i] < menor` y actualiza la variable `menor`.'
  },

  {
    id: 'reto_matrices',
    title: 'Reto 3: Suma de la Diagonal Principal',
    category: 'Matrices 2D',
    difficulty: 'Medio',
    prompt: 'Dada una matriz de 3x3, suma los elementos donde la fila es igual a la columna (matriz[i][i]). Imprime la suma de la diagonal principal.',
    initialCode: `#include <iostream>
using namespace std;

int main() {
    int matriz[3][3] = {
        {4, 1, 9},
        {2, 6, 8},
        {5, 3, 7}
    };

    int sumaDiagonal = 0;

    // TODO: Suma los elementos de la diagonal principal
    for (int i = 0; i < 3; i++) {
        sumaDiagonal += matriz[i][i];
    }

    cout << "Suma diagonal: " << sumaDiagonal << endl;
    return 0;
}`,
    expectedOutput: 'Suma diagonal: 17',
    hint: 'En la diagonal principal, el índice de fila y columna coinciden: `matriz[i][i]` (4 + 6 + 7 = 17).'
  },

  {
    id: 'reto_structs',
    title: 'Reto 4: Registro de Productos e Inventario',
    category: 'Structs',
    difficulty: 'Medio',
    prompt: 'Crea una estructura `Producto` con nombre (string), precio (int) y stock (int). Calcula el valor total del inventario de 2 productos (precio * stock).',
    initialCode: `#include <iostream>
#include <string>
using namespace std;

struct Producto {
    string nombre;
    int precio;
    int stock;
};

int main() {
    Producto p1;
    p1.nombre = "Teclado";
    p1.precio = 50;
    p1.stock = 4;

    Producto p2;
    p2.nombre = "Raton";
    p2.precio = 25;
    p2.stock = 6;

    int total = (p1.precio * p1.stock) + (p2.precio * p2.stock);

    cout << "Valor total inventario: " << total << endl;
    return 0;
}`,
    expectedOutput: 'Valor total inventario: 350',
    hint: 'Multiplica precio por stock de cada producto y súmalos: (50*4) + (25*6) = 200 + 150 = 350.'
  },

  {
    id: 'reto_archivos',
    title: 'Reto 5: Lectura de numeros.txt con atoi',
    category: 'Archivos (fstream)',
    difficulty: 'Desafiante',
    prompt: 'Abre el archivo "numeros.txt", que contiene filas de números separados por comas. Lee los primeros números de cada fila usando getline con coma y súmalos usando atoi. (El archivo numeros.txt tiene en la primera columna los valores: 10, 12, 8).',
    initialCode: `#include <iostream>
#include <fstream>
#include <string>
#include <cstdlib>
using namespace std;

int main() {
    ifstream archivo("numeros.txt");
    string valorStr;
    string restoLinea;
    int suma = 0;

    // Leemos la primera columna de cada fila
    while (getline(archivo, valorStr, ',')) {
        int num = atoi(valorStr.c_str());
        suma += num;
        getline(archivo, restoLinea); // Consumir el resto de la linea
    }

    archivo.close();
    cout << "Suma primera columna: " << suma << endl;
    return 0;
}`,
    expectedOutput: 'Suma primera columna: 30',
    hint: 'En cada fila lee el primer token con `,`, conviértelo con `atoi`, y luego usa `getline(archivo, restoLinea)` para saltar al final de la línea.'
  }
];
