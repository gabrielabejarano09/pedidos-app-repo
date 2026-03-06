# Sistema de Gestión de Pedidos – Helm + ArgoCD
## Gabriela Bejarano, Isabela Diaz
Este repositorio contiene la infraestructura necesaria para desplegar una aplicación completa de gestión de pedidos compuesta por base de datos, backend y frontend, usando Helm para empaquetado y ArgoCD para entrega continua. El proyecto cumple con la estructura solicitada en el parcial: chart de Helm con PostgreSQL como dependencia, recursos Kubernetes obligatorios e integración con ArgoCD para los entornos dev y prod. :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}
 
## Componentes de la solución
 
- **Base de datos:** PostgreSQL
- **Backend:** API REST para gestión de pedidos
- **Frontend:** aplicación web que consume la API
- **Orquestación:** Kubernetes
- **Empaquetado:** Helm
- **GitOps:** ArgoCD
 
La aplicación se despliega en dos entornos:
 
- **Development (dev)**
- **Production (prod)**
 
Cada entorno se gestiona mediante ArgoCD, con archivos `application.yaml` independientes por ambiente. :contentReference[oaicite:4]{index=4}
 
---
 
## Arquitectura del sistema
 
La arquitectura implementada es la siguiente:
 
```text
                              ┌────────────────────────────┐
                              │           Usuario          │
                              │        Navegador Web       │
                              └──────────────┬─────────────┘
                                             │
                                             │ HTTP / HTTPS
                                             ▼
                              ┌────────────────────────────┐
                              │        Load Balancer       │
                              │     (Cloud / Kubernetes)   │
                              └──────────────┬─────────────┘
                                             │
                                             ▼
                              ┌────────────────────────────┐
                              │          Ingress           │
                              │     (NGINX Controller)     │
                              │                            │
                              │   /       → Frontend       │
                              │   /api/*  → Backend        │
                              └───────┬──────────┬─────────┘
                                      │          │
                                      │          │
                                      ▼          ▼
                    ┌────────────────────────┐   ┌────────────────────────┐
                    │      Frontend Pod      │   │      Backend Pod       │
                    │                        │   │                        │
                    │   React App + NGINX    │   │       REST API         │
                    │   Deployment + Service │   │   Deployment + Service │
                    │   Port 80              │   │   Port 3000            │
                    └───────────┬────────────┘   └───────────┬────────────┘
                                │                            │
                                │ HTTP /api/*               │ SQL / Prisma
                                └───────────────►────────────┘
                                                     │
                                                     ▼
                                      ┌────────────────────────────┐
                                      │         PostgreSQL         │
                                      │                            │
                                      │   Bitnami Helm Chart       │
                                      │   Stateful Database        │
                                      │   + PersistentVolumeClaim  │
                                      └────────────────────────────┘
````

## Sistema de Despliegue
 
El sistema de despliegue implementado es el siguiente:

```text
                     ┌────────────────────────────┐
                     │        Git Repository      │
                     │                            │
                     │  Helm Chart + Values       │
                     │  environments/dev          │
                     │  environments/prod         │
                     └──────────────┬─────────────┘
                                    │
                                    │ GitOps
                                    ▼
                     ┌────────────────────────────┐
                     │           ArgoCD           │
                     │                            │
                     │   Observa cambios en Git   │
                     │   Sincroniza el cluster    │
                     └──────────────┬─────────────┘
                                    │
                                    ▼
                     ┌────────────────────────────┐
                     │      Kubernetes Cluster    │
                     │                            │
                     │  Helm chart desplegado     │
                     │                            │
                     │  ├─ Frontend Deployment    │
                     │  ├─ Backend Deployment     │
                     │  ├─ PostgreSQL             │
                     │  ├─ Services               │
                     │  ├─ Ingress                │
                     │  └─ Secrets / ConfigMaps   │
                     └────────────────────────────┘
````
### Flujo de la aplicación
 
1. El usuario accede al **frontend**.
2. El **Ingress** enruta el tráfico:
 
   * `/` hacia el frontend
   * `/api/*` hacia el backend
3. El **backend** se conecta a PostgreSQL usando credenciales almacenadas en **Secret**.
4. PostgreSQL persiste la información en un **PersistentVolumeClaim**, de modo que los pedidos se mantienen aunque el pod se reinicie.   
 
---
 
## Estructura del repositorio
 
```text
pedidos-app-repo/
│
├── pedidos-app-helm/
│   ├── charts/
│   │   └── pedidos-app/
│   │       ├── templates/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values-dev.yaml
│   │       ├── values-prod.yaml
│   │       └── values-secret.yaml
│
└── environments/
    ├── dev/
    │   └── application.yaml
    └── prod/
        └── application.yaml
```
 
Esta organización sigue la separación por ambientes solicitada en el parcial y permite que ArgoCD gestione dev y prod desde el mismo repositorio Git.
 
---
 
## Build del frontend
 
El frontend se construye con una imagen multi-stage y permite definir el modo de compilación mediante `VITE_MODE`:
 
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_MODE=production
RUN npm run build -- --mode $VITE_MODE
 
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```
 
Durante las pruebas manuales, el frontend consumió la API con:
 
```env
VITE_API_BASE=http://localhost:3000/api
```
 
y sus endpoints se construyen a partir de esa base. En despliegues con Ingress, el acceso esperado al backend es mediante la ruta `/api/*`, según lo definido en el parcial.
 
---
 
## Instalación manual con Helm
 
Para instalar el chart manualmente, primero se agrega el repositorio de Bitnami, que se usa para PostgreSQL como dependencia del chart:
 
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```
 
### Despliegue del entorno DEV
 
```bash
helm install pedidos-dev . \
  -n pedidos-dev \
  -f values.yaml \
  -f values-dev.yaml \
  -f values-secret.yaml
```
 
Este despliegue crea los recursos del entorno `pedidos-dev`, incluyendo frontend, backend, base de datos, servicios, ingress y almacenamiento persistente.
 
### Despliegue del entorno PROD
 
```bash
helm install pedidos-prod . \
  -n pedidos-prod \
  -f values.yaml \
  -f values-prod.yaml \
  -f values-secret.yaml
```
 
Este despliegue crea el entorno `pedidos-prod` con su propia configuración y namespace independiente.
 
> En caso de reinstalación o actualización, puede usarse `helm upgrade --install` en lugar de `helm install`.
 
---
 
## Acceso manual a los servicios con port-forward
 
Para pruebas locales del entorno dev se usó `kubectl port-forward`.
 
### Frontend
 
```bash
kubectl port-forward -n pedidos-dev svc/pedidos-dev-frontend 8081:80
```
 
Acceso:
 
```text
http://localhost:8081
```
 
### Backend
 
```bash
kubectl port-forward -n pedidos-dev svc/pedidos-dev-backend 3000:3000
```
 
Acceso:
 
```text
http://localhost:3000/api/orders
```
 
Estos endpoints se usaron para validar el funcionamiento end-to-end entre frontend, backend y base de datos.
 
---
 
## Configuración de ArgoCD
 
ArgoCD se configuró para gestionar automáticamente ambos entornos a partir del repositorio Git. Para ello se definieron dos aplicaciones independientes:
 
```text
environments/
├── dev/
│   └── application.yaml
└── prod/
    └── application.yaml
```
 
Cada `Application` apunta al chart de Helm y al archivo de values correspondiente a su ambiente. Esto permite mantener separación entre dev y prod y sincronizar cada uno con su namespace.
 
### Aplicación de los manifiestos de ArgoCD
 
```bash
kubectl apply -f environments/dev/application.yaml
kubectl apply -f environments/prod/application.yaml
```
 
Con esto se crean las aplicaciones:
 
* `pedido-app-dev`
* `pedidos-app-prod`
 
---
 
## Sincronización automática con ArgoCD
 
ArgoCD se configuró para sincronización automática, de manera que cuando se modifica el repositorio Git, el estado del clúster se actualiza sin ejecutar comandos manuales. Esto cumple con el requerimiento de automatización GitOps del parcial.  
 
La política de sincronización usada es del tipo:
 
```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```
 
Esto permite:
 
* aplicar cambios automáticamente,
* eliminar recursos obsoletos,
* corregir drift entre Git y el clúster.
 
---
 
## Recursos desplegados
 
El chart de Helm despliega los siguientes recursos, tal como exige el parcial:
 
* **Deployment** para frontend y backend
* **Service** para frontend y backend
* **Ingress** con rutas `/` y `/api/*`
* **PersistentVolumeClaim** para PostgreSQL
* **ConfigMap** para configuración no sensible del backend
* **Secret** para credenciales de base de datos
* **HorizontalPodAutoscaler** para el backend
* **PostgreSQL** como dependencia oficial de Bitnami  
 
---
 
## Endpoints de acceso
 
### Acceso local de pruebas
 
Frontend:
 
```text
http://localhost:8081
```
 
Backend:
 
```text
http://localhost:3000/api/orders
```
 
### Endpoints consumidos por el frontend
 
Base URL configurada para pruebas manuales:
 
```env
VITE_API_BASE=http://localhost:3000/api
```
 
Ejemplo de consumo:
 
```text
GET http://localhost:3000/api/orders
```
 
---
 
## Dashboard de ArgoCD
 
Las aplicaciones desplegadas pueden visualizarse en el dashboard de ArgoCD, donde se valida:
 
* estado de salud,
* estado de sincronización,
* recursos desplegados por ambiente.
 
 
 
---
## ArgoCD Dashboard
 
<img width="1600" height="722" alt="image" src="https://github.com/user-attachments/assets/cfa22213-81e2-4d75-afe5-b64fbef0a17b" />

 
---
 
## Tecnologías utilizadas
 
* Kubernetes
* Helm
* ArgoCD
* PostgreSQL
* Docker
* NGINX
* Frontend SPA
* API REST
