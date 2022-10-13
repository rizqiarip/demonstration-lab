# Demonstration Lab Documentation
  1. Gitlab CE
  2. Kubernetes Cluster
  3. Jenkins CI/CD
  4. Sonarqube CE
# Gitlab CE
  
  - Instalasi Gitlab CE
  - Membuat repository untuk menyimpan source code
  - Membuat issue list/board untuk membuat kanban board
   
## Instalasi Gitlab CE
  
  - Install dependencies for Gitlab-ce 
  ```console
  yum install -y curl postfix ca-certificates
  ```
  
  - Install `Gitlab-ce`
  ```console
  curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash
  EXTERNAL_URL="http://gitlab-ce.arip.com" yum install -y gitlab-ce
  ```
  
## Membuat issue list / board untuk membuat kanban board
  
  Dashboard Gitlab > Issues > Board > New Issue
  
  ![image](https://user-images.githubusercontent.com/89076954/195568928-f333f085-370d-4822-b674-5fc055378372.png)
  
  ![image](https://user-images.githubusercontent.com/89076954/195570453-18705a63-f099-4e34-90aa-fc670a05426f.png)
  
# Kubernetes Cluster

  - Instalasi Kubernetes Cluster, 1 Master dan 1 Worker
  - Instalasi dan konfigurasi Ingress Controller Nginx
  - Membaut Dynamic Storage Class dengan NFS
  - Deploy Aplikasi Wordpress dan Database MySQL menggunakan PVC
  - Instalasi dan konfigurasi MetalLB untuk Load Balancer
  - Deploy Aplikasi Nginx dengan ekspos akses Load Balancer menggunakan MetalLB

## Instalasi kubernetes cluster, 1 master 1 worker
## Instalasi dan Konfigurasi ingress controller Nginx
## Membuat Dynamic Storage Class dengan NFS
## Deploy Aplikasi Wordpress + DB (Menggunakan PVC)
## Instalasi dan Konfigurasi MetalLB untuk Load Balancer
## Deploy Aplikasi Nginx dengan eskpos akses Load Balancer
