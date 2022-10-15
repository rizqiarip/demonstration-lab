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
  
  ![image](https://user-images.githubusercontent.com/89076954/195581550-ffeb6041-d3d5-4793-aa67-37911f3ec90c.png)
  
# Kubernetes Cluster

  - Instalasi Kubernetes Cluster, 1 Master dan 1 Worker
  - Instalasi dan konfigurasi Ingress Controller Nginx
  - Membaut Dynamic Storage Class dengan NFS
  - Deploy Aplikasi Wordpress dan Database MySQL menggunakan PVC
  - Instalasi dan konfigurasi MetalLB untuk Load Balancer
  - Deploy Aplikasi Nginx dengan ekspos akses Load Balancer menggunakan MetalLB

## Instalasi kubernetes cluster, 1 master 1 worker

  - Instal `Docker` (Master & Worker Node)
  
  ```console
  sudo apt-get update
  curl -fSsl https://get.docker.com/ | sh

  cat <<EOF | sudo tee /etc/docker/daemon.json
  {
  "exec-opts": ["native.cgroupdriver=systemd"],
  "log-driver": "json-file",
  "log-opts": {
  "max-size": "100m"
  },
  "storage-driver": "overlay2" 
  }
  EOF 
  ```
  
  - Cek status `Docker`
  
  ```console
  sudo systemctl enable docker
  sudo systemctl daemon-reload
  sudo systemctl restart docker
  sudo systemctl status docker
  ```
  
  - Instal Kubernetes Tools Kubeadm, Kubeletet
  
## Instalasi dan Konfigurasi ingress controller Nginx
## Membuat Dynamic Storage Class dengan NFS
## Deploy Aplikasi Wordpress + DB (Menggunakan PVC)
## Instalasi dan Konfigurasi MetalLB untuk Load Balancer
## Deploy Aplikasi Nginx dengan eskpos akses Load Balancer
