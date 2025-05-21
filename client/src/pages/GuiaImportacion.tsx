import { useState } from 'react';
import { FaFileAlt, FaClipboardCheck, FaMoneyBillWave, FaCalendarAlt, FaCarSide, FaShip, FaIdCard, FaCalculator } from 'react-icons/fa';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const GuiaImportacion = () => {
  const [activeTab, setActiveTab] = useState('requisitos');

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/95 to-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Guía de Importación de Vehículos Clásicos
          </h1>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Todo lo que necesitas saber para importar tu auto clásico a Argentina de manera segura y legal.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-neutral-100 flex-grow">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Tabs defaultValue="requisitos" className="w-full" onValueChange={setActiveTab}>
              <div className="bg-neutral-800 px-4 py-2">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto bg-transparent gap-2">
                  <TabsTrigger 
                    value="requisitos" 
                    className={`py-3 text-sm md:text-base font-medium rounded-md ${activeTab === 'requisitos' ? 'bg-primary text-white' : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'}`}
                  >
                    <FaClipboardCheck className="mr-2" />
                    Requisitos Generales
                  </TabsTrigger>
                  <TabsTrigger 
                    value="proceso" 
                    className={`py-3 text-sm md:text-base font-medium rounded-md ${activeTab === 'proceso' ? 'bg-primary text-white' : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'}`}
                  >
                    <FaShip className="mr-2" />
                    Proceso de Importación
                  </TabsTrigger>
                  <TabsTrigger 
                    value="costos" 
                    className={`py-3 text-sm md:text-base font-medium rounded-md ${activeTab === 'costos' ? 'bg-primary text-white' : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'}`}
                  >
                    <FaMoneyBillWave className="mr-2" />
                    Costos y Aranceles
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="requisitos" className="mt-0">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-800">Requisitos para Importar un Vehículo Clásico</h2>
                  
                  <p className="mb-6 text-neutral-600">
                    Los vehículos clásicos (fabricados entre 1900 y 1995) pueden ser importados a Argentina bajo ciertas condiciones.
                    Aquí detallamos todos los requisitos que debes cumplir para realizar el proceso de manera exitosa.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <FaCarSide className="text-primary text-xl" />
                        </div>
                        <h3 className="text-xl font-semibold">Condiciones del Vehículo</h3>
                      </div>
                      <ul className="space-y-2 text-neutral-700">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Fabricado entre 1900 y 1995 (antigüedad mínima de 30 años)</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>En condiciones originales o restaurado respetando las especificaciones de fábrica</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Motor en funcionamiento y en buen estado general</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Carrocería sin modificaciones estructurales significativas</p>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                          <FaFileAlt className="text-primary text-xl" />
                        </div>
                        <h3 className="text-xl font-semibold">Documentación Necesaria</h3>
                      </div>
                      <ul className="space-y-2 text-neutral-700">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Título de propiedad del vehículo (Title) o documentación equivalente</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Factura de compra (Bill of Sale) con datos completos</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Certificado de baja de patente del país de origen (si aplica)</p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          <p>Documentación que acredite la antigüedad del vehículo</p>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="mb-6">
                    <AccordionItem value="item-1">
                      <AccordionTrigger className="text-lg font-medium">Restricciones Importantes</AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-neutral-700 space-y-3">
                          <p>
                            <strong>No se permiten importar:</strong>
                          </p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Vehículos con volante a la derecha (right-hand drive)</li>
                            <li>Vehículos con graves daños estructurales o de chasis</li>
                            <li>Vehículos que no puedan circular por sus propios medios</li>
                            <li>Vehículos con modificaciones que alteren significativamente el diseño original</li>
                            <li>Vehículos que no cumplan con las normativas mínimas de emisiones</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-6">
                    <h3 className="text-xl font-semibold mb-4">Beneficios para Vehículos Clásicos</h3>
                    <p className="text-neutral-700 mb-3">
                      Los vehículos clásicos importados gozan de algunos beneficios especiales:
                    </p>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <p>Exención de algunas normativas técnicas aplicables a vehículos modernos</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <p>Posibilidad de obtener una patente de colección (con restricciones de uso)</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <p>Menor costo de seguro respecto a vehículos de uso diario</p>
                      </li>
                    </ul>
                  </div>

                  <div className="text-center mt-8">
                    <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-md">
                      Descargar Lista de Requisitos (PDF)
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="proceso" className="mt-0">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-800">Proceso de Importación</h2>
                  
                  <p className="mb-6 text-neutral-600">
                    El proceso de importación de vehículos clásicos a Argentina consta de varias etapas que deben seguirse en orden.
                    Te guiamos paso a paso para que no tengas problemas durante el proceso.
                  </p>

                  <div className="space-y-8 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-16 flex justify-center">
                        <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                          1
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">Compra del Vehículo</h3>
                        <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                          <ul className="space-y-3 text-neutral-700">
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Verificar que el vehículo cumpla con los requisitos para importación</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Solicitar toda la documentación original al vendedor</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Realizar una inspección técnica previa a la compra</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Formalizar la compra con contrato detallado</p>
                            </li>
                          </ul>
                          <div className="mt-4 text-sm bg-blue-50 p-3 rounded border border-blue-100 text-neutral-700">
                            <strong className="text-blue-700">Recomendación:</strong> Utiliza nuestro servicio para asegurarte de que el vehículo cumple con los requisitos antes de comprarlo.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-16 flex justify-center">
                        <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                          2
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">Preparación y Envío</h3>
                        <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                          <ul className="space-y-3 text-neutral-700">
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Contratar transporte desde el punto de compra hasta el puerto</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Asegurar el vehículo para el transporte internacional</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Coordinar con agente de carga para reserva de contenedor</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Preparar vehículo para el transporte (vaciado de fluidos, etc.)</p>
                            </li>
                          </ul>
                          <div className="mt-4 text-sm bg-blue-50 p-3 rounded border border-blue-100 text-neutral-700">
                            <strong className="text-blue-700">Tiempo estimado:</strong> Entre 2 y 3 semanas desde la compra hasta el embarque.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-16 flex justify-center">
                        <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                          3
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">Trámites Aduaneros</h3>
                        <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                          <ul className="space-y-3 text-neutral-700">
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Presentar solicitud de importación ante Aduana Argentina</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Gestionar certificado de antigüedad por perito especializado</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Pagar aranceles e impuestos de importación</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Inspección física del vehículo por autoridades aduaneras</p>
                            </li>
                          </ul>
                          <div className="mt-4 text-sm bg-blue-50 p-3 rounded border border-blue-100 text-neutral-700">
                            <strong className="text-blue-700">Documentación clave:</strong> Certificado de antigüedad, título de propiedad, factura de compra y conocimiento de embarque.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-16 flex justify-center">
                        <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                          4
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">Registro y Patentamiento</h3>
                        <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                          <ul className="space-y-3 text-neutral-700">
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Realizar verificación policial del vehículo</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Tramitar alta en Registro Automotor</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Obtener placa patente (regular o de colección)</p>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <p>Contratar seguro para vehículo importado</p>
                            </li>
                          </ul>
                          <div className="mt-4 text-sm bg-blue-50 p-3 rounded border border-blue-100 text-neutral-700">
                            <strong className="text-blue-700">Tiempo estimado:</strong> Entre 2 y 4 semanas para completar el proceso de registro.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <FaCalendarAlt className="text-primary text-xl" />
                      </div>
                      <h3 className="text-xl font-semibold">Tiempos Estimados</h3>
                    </div>
                    <div className="space-y-3 text-neutral-700">
                      <p className="mb-2">El proceso completo de importación puede tomar:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-neutral-200 rounded-md p-3 text-center">
                          <p className="text-primary font-bold text-lg">2-3 meses</p>
                          <p className="text-sm">Caso optimista</p>
                        </div>
                        <div className="border border-neutral-200 rounded-md p-3 text-center bg-neutral-100">
                          <p className="text-primary font-bold text-lg">3-4 meses</p>
                          <p className="text-sm">Caso promedio</p>
                        </div>
                        <div className="border border-neutral-200 rounded-md p-3 text-center">
                          <p className="text-primary font-bold text-lg">4-6 meses</p>
                          <p className="text-sm">Caso complejo</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <Button className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-md">
                      Solicitar Asistencia en Importación
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="costos" className="mt-0">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-800">Costos y Aranceles</h2>
                  
                  <p className="mb-6 text-neutral-600">
                    Importar un vehículo clásico a Argentina implica diversos costos y aranceles.
                    A continuación detallamos los principales gastos que debes considerar en tu presupuesto.
                  </p>

                  <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-8">
                    <h3 className="text-xl font-semibold mb-4">Calculadora de Importación</h3>
                    <p className="text-neutral-700 mb-4">
                      Utiliza nuestra calculadora para estimar los costos totales de importación:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Valor del vehículo (USD)
                          </label>
                          <input
                            type="number"
                            className="w-full p-2 border border-neutral-300 rounded-md"
                            placeholder="Ej: 25000"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Año de fabricación
                          </label>
                          <select className="w-full p-2 border border-neutral-300 rounded-md">
                            <option value="">Selecciona año</option>
                            <option value="1960">Antes de 1960</option>
                            <option value="1970">1960-1970</option>
                            <option value="1980">1971-1980</option>
                            <option value="1990">1981-1990</option>
                            <option value="1995">1991-1995</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Tipo de vehículo
                          </label>
                          <select className="w-full p-2 border border-neutral-300 rounded-md">
                            <option value="">Selecciona tipo</option>
                            <option value="sedan">Sedán</option>
                            <option value="coupe">Coupé</option>
                            <option value="convertible">Convertible</option>
                            <option value="wagon">Station Wagon</option>
                            <option value="pickup">Pickup</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            País de origen
                          </label>
                          <select className="w-full p-2 border border-neutral-300 rounded-md">
                            <option value="">Selecciona país</option>
                            <option value="us">Estados Unidos</option>
                            <option value="eu">Unión Europea</option>
                            <option value="jp">Japón</option>
                            <option value="uk">Reino Unido</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <Button className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-md">
                        Calcular Costos
                      </Button>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Desglose de Costos</h3>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-neutral-800 text-white">
                            <th className="p-3 text-left">Concepto</th>
                            <th className="p-3 text-left">Descripción</th>
                            <th className="p-3 text-right">Costo Aproximado</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-neutral-200">
                            <td className="p-3 font-medium">Arancel de Importación</td>
                            <td className="p-3 text-sm">Aplicable sobre valor del vehículo (varía según antigüedad)</td>
                            <td className="p-3 text-right">5% - 35%</td>
                          </tr>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <td className="p-3 font-medium">IVA</td>
                            <td className="p-3 text-sm">Impuesto al Valor Agregado sobre valor + arancel</td>
                            <td className="p-3 text-right">10.5% - 21%</td>
                          </tr>
                          <tr className="border-b border-neutral-200">
                            <td className="p-3 font-medium">Tasa Estadística</td>
                            <td className="p-3 text-sm">Aplicable a todas las importaciones</td>
                            <td className="p-3 text-right">2.5%</td>
                          </tr>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <td className="p-3 font-medium">Flete Internacional</td>
                            <td className="p-3 text-sm">Transporte marítimo desde origen a Argentina</td>
                            <td className="p-3 text-right">$1,500 - $3,500</td>
                          </tr>
                          <tr className="border-b border-neutral-200">
                            <td className="p-3 font-medium">Seguro Internacional</td>
                            <td className="p-3 text-sm">Cobertura durante el transporte</td>
                            <td className="p-3 text-right">1% - 3% del valor</td>
                          </tr>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <td className="p-3 font-medium">Gastos Portuarios</td>
                            <td className="p-3 text-sm">Terminal, handling, almacenaje</td>
                            <td className="p-3 text-right">$500 - $1,200</td>
                          </tr>
                          <tr className="border-b border-neutral-200">
                            <td className="p-3 font-medium">Honorarios Despachante</td>
                            <td className="p-3 text-sm">Gestoría aduanera profesional</td>
                            <td className="p-3 text-right">$800 - $1,500</td>
                          </tr>
                          <tr className="border-b border-neutral-200 bg-neutral-50">
                            <td className="p-3 font-medium">Registración</td>
                            <td className="p-3 text-sm">Alta en Registro Automotor y patentamiento</td>
                            <td className="p-3 text-right">$300 - $600</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-secondary/10 p-3 rounded-full">
                        <FaCalculator className="text-secondary text-xl" />
                      </div>
                      <h3 className="text-xl font-semibold">Ejemplo Práctico</h3>
                    </div>
                    <p className="text-neutral-700 mb-4">
                      Costo total estimado para un vehículo clásico de USD 25,000 importado desde Estados Unidos:
                    </p>
                    <div className="space-y-2 text-neutral-700">
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>Valor del vehículo:</span>
                        <span className="font-medium">USD 25,000</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>Arancel de importación (20%):</span>
                        <span className="font-medium">USD 5,000</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>IVA (10.5%):</span>
                        <span className="font-medium">USD 3,150</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>Tasa estadística (2.5%):</span>
                        <span className="font-medium">USD 625</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>Flete y seguro:</span>
                        <span className="font-medium">USD 2,500</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>Gastos portuarios y despacho:</span>
                        <span className="font-medium">USD 1,800</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-dashed border-neutral-300">
                        <span>Registración y patentamiento:</span>
                        <span className="font-medium">USD 500</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold text-lg">
                        <span>COSTO TOTAL APROXIMADO:</span>
                        <span className="text-secondary">USD 38,575</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center mt-8">
                    <Button className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-md">
                      Consultar con un Experto
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-secondary/90 to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            ¿Listo para importar tu auto clásico?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Comienza la búsqueda del vehículo perfecto para ti y nosotros te ayudaremos con todo el proceso de importación.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-white text-secondary hover:bg-gray-100 font-semibold py-3 px-6 rounded-md transition-colors text-base"
              onClick={() => window.location.href = '/busqueda'}
            >
              Buscar Vehículos
            </Button>
            <Button 
              className="bg-transparent text-white hover:bg-white/10 border border-white font-semibold py-3 px-6 rounded-md transition-colors text-base"
              onClick={() => window.location.href = '/contact'}
            >
              Contactar Asesor
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GuiaImportacion;