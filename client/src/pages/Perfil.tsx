import { useState } from 'react';
import { FaUser, FaHeart, FaCog, FaBell, FaHistory, FaShieldAlt, FaCarSide, FaEdit, FaTrashAlt } from 'react-icons/fa';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/utils';

const Perfil = () => {
  const [activeTab, setActiveTab] = useState('datos');
  
  // Datos simulados para la página de perfil
  const userData = {
    nombre: "Juan Pérez",
    email: "juan.perez@email.com",
    telefono: "+54 9 11 1234-5678",
    direccion: "Av. Corrientes 1234, CABA",
    fechaRegistro: "10/04/2023"
  };
  
  // Ejemplo de vehículos favoritos
  const favoritos = [
    {
      id: 1,
      imageUrl: "https://via.placeholder.com/300x200?text=Ford+Mustang",
      title: "Ford Mustang Fastback 1967",
      year: 1967,
      price: 35000,
      location: "Estados Unidos",
      source: "eBay Motors"
    },
    {
      id: 2,
      imageUrl: "https://via.placeholder.com/300x200?text=Chevrolet+Corvette",
      title: "Chevrolet Corvette Stingray 1969",
      year: 1969,
      price: 42500,
      location: "Estados Unidos",
      source: "Bring a Trailer"
    },
    {
      id: 3,
      imageUrl: "https://via.placeholder.com/300x200?text=Porsche+911",
      title: "Porsche 911 Targa 1973",
      year: 1973,
      price: 65000,
      location: "Alemania",
      source: "eBay Motors"
    }
  ];
  
  // Historial de búsquedas
  const historialBusquedas = [
    { id: 1, query: "Ford Mustang 1965", fecha: "15/04/2024" },
    { id: 2, query: "Chevrolet Impala 1967", fecha: "12/04/2024" },
    { id: 3, query: "Porsche 911 1970", fecha: "10/04/2024" },
    { id: 4, query: "Volkswagen Beetle 1960", fecha: "05/04/2024" },
    { id: 5, query: "Dodge Charger 1969", fecha: "01/04/2024" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <section className="bg-gradient-to-r from-primary/95 to-primary py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Mi Perfil
          </h1>
          <p className="text-white/90">
            Administra tu cuenta, vehículos favoritos y preferencias
          </p>
        </div>
      </section>
      
      <section className="py-10 flex-grow bg-neutral-100">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <Tabs defaultValue="datos" className="w-full" onValueChange={setActiveTab}>
              <div className="bg-neutral-800 px-4 py-2">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto bg-transparent gap-2">
                  <TabsTrigger 
                    value="datos" 
                    className={`py-3 text-sm md:text-base font-medium rounded-md ${activeTab === 'datos' ? 'bg-secondary text-white' : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'}`}
                  >
                    <FaUser className="mr-2" />
                    Datos Personales
                  </TabsTrigger>
                  <TabsTrigger 
                    value="favoritos" 
                    className={`py-3 text-sm md:text-base font-medium rounded-md ${activeTab === 'favoritos' ? 'bg-secondary text-white' : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'}`}
                  >
                    <FaHeart className="mr-2" />
                    Mis Favoritos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="config" 
                    className={`py-3 text-sm md:text-base font-medium rounded-md ${activeTab === 'config' ? 'bg-secondary text-white' : 'bg-neutral-700 text-white/80 hover:bg-neutral-600'}`}
                  >
                    <FaCog className="mr-2" />
                    Configuración
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="datos" className="mt-0">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-800">Información Personal</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 text-center">
                        <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <FaUser className="text-neutral-500 text-4xl" />
                        </div>
                        <h3 className="text-xl font-semibold mb-1">{userData.nombre}</h3>
                        <p className="text-neutral-500 text-sm mb-4">Miembro desde {userData.fechaRegistro}</p>
                        <Button className="bg-secondary hover:bg-secondary/90 text-white w-full mb-2">
                          Cambiar Foto
                        </Button>
                        <Button variant="outline" className="w-full">
                          Ver Actividad
                        </Button>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                        <h3 className="text-lg font-semibold mb-4">Datos de Contacto</h3>
                        
                        <form className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="nombre" className="text-neutral-700">Nombre Completo</Label>
                              <Input 
                                id="nombre" 
                                defaultValue={userData.nombre} 
                                className="mt-1" 
                              />
                            </div>
                            <div>
                              <Label htmlFor="email" className="text-neutral-700">Correo Electrónico</Label>
                              <Input 
                                id="email" 
                                type="email"
                                defaultValue={userData.email} 
                                className="mt-1" 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="telefono" className="text-neutral-700">Teléfono</Label>
                              <Input 
                                id="telefono" 
                                defaultValue={userData.telefono} 
                                className="mt-1" 
                              />
                            </div>
                            <div>
                              <Label htmlFor="pais" className="text-neutral-700">País</Label>
                              <select 
                                id="pais" 
                                className="w-full mt-1 p-2 border border-neutral-300 rounded-md"
                                defaultValue="AR"
                              >
                                <option value="AR">Argentina</option>
                                <option value="UY">Uruguay</option>
                                <option value="CL">Chile</option>
                                <option value="BR">Brasil</option>
                                <option value="PY">Paraguay</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="direccion" className="text-neutral-700">Dirección</Label>
                            <Input 
                              id="direccion" 
                              defaultValue={userData.direccion} 
                              className="mt-1" 
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="about" className="text-neutral-700">Sobre ti</Label>
                            <Textarea 
                              id="about" 
                              defaultValue="Soy un entusiasta de los autos clásicos, especialmente interesado en modelos americanos de los años 60 y 70." 
                              className="mt-1" 
                              rows={4}
                            />
                          </div>
                          
                          <div className="flex justify-end">
                            <Button className="bg-secondary hover:bg-secondary/90 text-white">
                              Guardar Cambios
                            </Button>
                          </div>
                        </form>
                      </div>
                      
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mt-6">
                        <h3 className="text-lg font-semibold mb-4">Cambiar Contraseña</h3>
                        
                        <form className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword" className="text-neutral-700">Contraseña Actual</Label>
                            <Input 
                              id="currentPassword" 
                              type="password"
                              className="mt-1" 
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="newPassword" className="text-neutral-700">Nueva Contraseña</Label>
                              <Input 
                                id="newPassword" 
                                type="password"
                                className="mt-1" 
                              />
                            </div>
                            <div>
                              <Label htmlFor="confirmPassword" className="text-neutral-700">Confirmar Contraseña</Label>
                              <Input 
                                id="confirmPassword" 
                                type="password"
                                className="mt-1" 
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button className="bg-secondary hover:bg-secondary/90 text-white">
                              Actualizar Contraseña
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="favoritos" className="mt-0">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-neutral-800">Mis Vehículos Favoritos</h2>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FaHistory className="text-secondary" />
                      <span>Historial de Búsquedas</span>
                    </Button>
                  </div>
                  
                  {favoritos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoritos.map((vehiculo) => (
                        <div key={vehiculo.id} className="bg-white rounded-lg border border-neutral-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                          <div className="relative h-48 bg-neutral-200">
                            <img 
                              src={vehiculo.imageUrl} 
                              alt={vehiculo.title}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Button 
                                variant="destructive" 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                              >
                                <FaTrashAlt className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                              <p className="text-white font-medium">{vehiculo.title}</p>
                              <p className="text-white/80 text-sm">{vehiculo.year}</p>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-secondary font-bold text-lg">
                                {formatPrice(vehiculo.price)}
                              </span>
                              <span className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded text-xs">
                                {vehiculo.source}
                              </span>
                            </div>
                            <p className="text-neutral-600 text-sm flex items-center gap-1 mb-3">
                              <FaCarSide />
                              <span>Ubicación: {vehiculo.location}</span>
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Button className="bg-secondary hover:bg-secondary/90 text-white text-sm">
                                Ver Detalles
                              </Button>
                              <Button variant="outline" className="text-sm">
                                Compartir
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-neutral-50 p-8 rounded-lg border border-neutral-200 text-center">
                      <FaHeart className="text-neutral-300 text-5xl mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No tienes favoritos</h3>
                      <p className="text-neutral-600 mb-6">
                        Aún no has guardado ningún vehículo como favorito. Explora nuestro catálogo y guarda los vehículos que te interesen.
                      </p>
                      <Button 
                        className="bg-secondary hover:bg-secondary/90 text-white"
                        onClick={() => window.location.href = '/busqueda'}
                      >
                        Buscar Vehículos
                      </Button>
                    </div>
                  )}
                  
                  {historialBusquedas.length > 0 && (
                    <div className="mt-10">
                      <h3 className="text-xl font-semibold mb-4 text-neutral-800">Búsquedas Recientes</h3>
                      <div className="bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="p-4 border-b border-neutral-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Historial de Búsquedas</span>
                            <Button variant="ghost" size="sm" className="text-secondary text-sm">
                              Borrar Historial
                            </Button>
                          </div>
                        </div>
                        <ul className="divide-y divide-neutral-200">
                          {historialBusquedas.map((busqueda) => (
                            <li key={busqueda.id} className="p-4 hover:bg-neutral-100 transition-colors">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium text-neutral-800">{busqueda.query}</p>
                                  <p className="text-neutral-500 text-sm">{busqueda.fecha}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="h-8 px-2">
                                    Buscar
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <FaTrashAlt className="h-4 w-4 text-neutral-500" />
                                  </Button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="config" className="mt-0">
                  <h2 className="text-2xl font-bold mb-6 text-neutral-800">Configuración de la Cuenta</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-secondary/10 p-3 rounded-full">
                            <FaBell className="text-secondary text-xl" />
                          </div>
                          <h3 className="text-xl font-semibold">Notificaciones</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Alertas de Precio</p>
                              <p className="text-sm text-neutral-500">Recibe notificaciones cuando un vehículo baje de precio</p>
                            </div>
                            <Switch defaultChecked id="price-alerts" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Nuevos Listados</p>
                              <p className="text-sm text-neutral-500">Notificaciones de nuevos vehículos según tus criterios</p>
                            </div>
                            <Switch id="new-listings" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Actualizaciones por Email</p>
                              <p className="text-sm text-neutral-500">Recibe resúmenes semanales por correo</p>
                            </div>
                            <Switch defaultChecked id="email-updates" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Noticias y Promociones</p>
                              <p className="text-sm text-neutral-500">Información sobre novedades del servicio</p>
                            </div>
                            <Switch id="news" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-secondary/10 p-3 rounded-full">
                            <FaShieldAlt className="text-secondary text-xl" />
                          </div>
                          <h3 className="text-xl font-semibold">Privacidad</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Perfil Público</p>
                              <p className="text-sm text-neutral-500">Permite que otros usuarios vean tu perfil</p>
                            </div>
                            <Switch id="public-profile" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Historial de Búsqueda</p>
                              <p className="text-sm text-neutral-500">Almacenar tu historial de búsquedas</p>
                            </div>
                            <Switch defaultChecked id="search-history" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Cookies Analíticas</p>
                              <p className="text-sm text-neutral-500">Permitir cookies para mejorar la experiencia</p>
                            </div>
                            <Switch defaultChecked id="analytics-cookies" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-neutral-50 p-5 rounded-lg border border-neutral-200 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-secondary/10 p-3 rounded-full">
                            <FaCarSide className="text-secondary text-xl" />
                          </div>
                          <h3 className="text-xl font-semibold">Preferencias de Búsqueda</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="default-currency" className="text-neutral-700">Moneda Predeterminada</Label>
                            <select 
                              id="default-currency"
                              className="w-full mt-1 p-2 border border-neutral-300 rounded-md"
                              defaultValue="USD"
                            >
                              <option value="USD">Dólar Estadounidense (USD)</option>
                              <option value="EUR">Euro (EUR)</option>
                              <option value="ARS">Peso Argentino (ARS)</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label htmlFor="default-year-range" className="text-neutral-700">Rango de Años Predeterminado</Label>
                            <select 
                              id="default-year-range"
                              className="w-full mt-1 p-2 border border-neutral-300 rounded-md"
                              defaultValue="1950-1980"
                            >
                              <option value="all">Todos los años</option>
                              <option value="1900-1950">1900-1950</option>
                              <option value="1950-1980">1950-1980</option>
                              <option value="1980-1995">1980-1995</option>
                            </select>
                          </div>
                          
                          <div>
                            <Label htmlFor="default-sorts" className="text-neutral-700">Ordenamiento Predeterminado</Label>
                            <select 
                              id="default-sorts"
                              className="w-full mt-1 p-2 border border-neutral-300 rounded-md"
                              defaultValue="relevance"
                            >
                              <option value="relevance">Por Relevancia</option>
                              <option value="price_asc">Precio: Menor a Mayor</option>
                              <option value="price_desc">Precio: Mayor a Menor</option>
                              <option value="year_desc">Año: Más Reciente Primero</option>
                              <option value="year_asc">Año: Más Antiguo Primero</option>
                            </select>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Guardar Búsquedas Automáticamente</p>
                              <p className="text-sm text-neutral-500">Guarda cada búsqueda en tu historial</p>
                            </div>
                            <Switch defaultChecked id="auto-save-searches" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-5 rounded-lg border border-red-200">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Zona de Peligro</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700">
                              Desactivar Cuenta Temporalmente
                            </Button>
                          </div>
                          <div>
                            <Button variant="destructive" className="w-full">
                              Eliminar Cuenta Permanentemente
                            </Button>
                          </div>
                          <p className="text-xs text-neutral-500">
                            Al eliminar tu cuenta, todos tus datos personales, favoritos e historial serán borrados permanentemente y no podrán ser recuperados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-8">
                    <Button className="bg-secondary hover:bg-secondary/90 text-white">
                      Guardar Preferencias
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Perfil;