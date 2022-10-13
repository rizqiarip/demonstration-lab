# Demonstration-lab Documentation
  1. Gitlab CE
  2. Kubernetes Cluster
  3. Jenkins CI/CD
  4. Sonarqube CE
## Gitlab CE
# Instalasi Gitlab CE
  
  - Install dependencies 
  ```console
  yum install -y curl postfix ca-certificates
  ```
  
  - Install Gitlab-ce
  ```console
  curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash
  EXTERNAL_URL="http://gitlab-ce.arip.com" yum install -y gitlab-ce
  ```
  
# Membuat repository untuk menyimpan source code

# Membuat issue list / board Untuk membuat kanban board
## Kubernetes Cluster
# Instalasi kubernetes cluster, 1 master 1 worker
# Instalasi dan Konfigurasi ingress controller Nginx
# Membuat Dynamic Storage Class dengan NFS
# Deploy Aplikasi Wordpress + DB (Menggunakan PVC)
# Instalasi dan Konfigurasi MetalLB untuk Load Balancer
# Deploy Aplikasi Nginx dengan eskpos akses Load Balancer
