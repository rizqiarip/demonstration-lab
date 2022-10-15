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
  sudo systemctl start docker
  sudo systemctl daemon-reload
  sudo systemctl status docker
  ```
  
  - Instal Kubernetes Tools (Master & Worker Node)
  
  ```console
  sudo apt-get update
  sudo apt-get install -y apt-transport-https ca-certificates curl
  
  sudo curl -fsSLo /usr/share/keyrings/kubernetes-archive-keyring.gpg https://packages.cloud.google.com/apt/doc/apt-key.gpg
  echo "deb [signed-by=/usr/share/keyrings/kubernetes-archive-keyring.gpg] 
  https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
  
  sudo apt-get update
  sudo apt-get install -y kubelet kubeadm kubectl
  sudo apt-mark hold kubelet kubeadm kubectl
  ```
  
  - Setup Cluster (Master Node)
  
  ```console
  swapon -s
  sudo swapoff -a

  sudo kubeadm init --pod-network-cidr=192.168.0.0/16 --control-plane-endpoint=10.8.60.227
  
  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
  
  sudo kubeadm token list
  sudo openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
  ```
  
  - Join Cluster (Worker Node)
  
  ```console
  swapon -s
  sudo swapoff -a

  sudo kubeadm join --token s9k49t.do6h0xwn8xcvicuq 10.8.60.227:6443 
  --discovery-token-ca-cert-hash sha256:607f8f03d495b111de0685fc6811679cab7912f1e4f38a65c48cc734cdb944cd
  ```
  
## Instalasi dan Konfigurasi ingress controller Nginx
## Membuat Dynamic Storage Class dengan NFS
## Deploy Aplikasi Wordpress + DB (Menggunakan PVC)
## Instalasi dan Konfigurasi MetalLB untuk Load Balancer
## Deploy Aplikasi Nginx dengan eskpos akses Load Balancer
