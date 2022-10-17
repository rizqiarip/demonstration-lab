# Demonstration Lab Documentation

  1. Gitlab & Sonarqube (10.8.60.174)
  2. Kubernetes Cluster (10.8.60.227, 10.8.60.228)
  3. Jenkins CI/CD (10.8.60.226)

## Gitlab-ce Installation
  
  - Install dependencies for `gitlab-ce` 
  ```console
  yum install -y curl postfix ca-certificates
  ```
  
  - Install `gitlab-ce`
  ```console
  curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh | sudo bash
  EXTERNAL_URL="http://gitlab-ce.arip.com" yum install -y gitlab-ce
  ```
  
### Create issue list for kanban board
  
  Dashboard Gitlab > Issues > Board > New Issue
  
  ![image](https://user-images.githubusercontent.com/89076954/195581550-ffeb6041-d3d5-4793-aa67-37911f3ec90c.png)
  
## Kubernetes Cluster Installation with 1 Master and 1 Worker node

  - Install `docker` (Master & Worker Node)
  
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
  
  - Check `docker` status
  
  ```console
  sudo systemctl enable docker
  sudo systemctl start docker
  sudo systemctl daemon-reload
  sudo systemctl status docker
  ```
  
  - Install Kubernetes Tools like Kubeadm, Kubelet, Kubectl (Master & Worker Node)
  
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
  
  - Check Nodes (Master Node)
  
  ```console
  kubectl get nodes
  ```
  
  -  Setup Helm (Master Node)

  ```console
  sudo apt install apt-transport-https --yes
  curl https://baltocdn.com/helm/signing.asc | sudo apt-key add -
  echo "deb https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list

  sudo apt install -y helm
  ```
  
## Instalasi dan Konfigurasi ingress controller Nginx 

  - Install Ingress Controller Nginx using helm
  
  ```console
  helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
  helm repo update
  helm install ingress ingress-nginx/ingress-nginx --set controller.service.loadBalancerIP=10.8.60.227 -n ingress --create-namespace
  ```
  
## Membuat Dynamic Storage Class dengan NFS

  - Install `nfs-server` in Master and Worker node
  
  ```console
  sudo apt install nfs-kernel-server nfs-common portmap
  sudo systemctl start nfs-server
  sudo systemctl status nfs-server  
  ```
  
  - Setup directory NFS in Worker node
  
  ```console
  mkdir -p /data 
  sudo nano /etc/exports
  /data  *(rw,sync,no_subtree_check,no_root_squash,insecure)"
  sudo exportfs -rv
  showmount -e
  ```
  
  - Tes NFS from master to worker
  
  ```console
  sudo mount -t nfs 10.8.60.228:/data /mnt
  ```
  
  - Method 1 connecting to nfs directly
  
  ```console
  ```
  
  - Method 2 using persistent volume claim and storage class
  
  ```console
  helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
  helm install nfs nfs-subdir-external-provisioner/nfs-subdir-external-provisioner --set nfs.server=10.8.60.228 
  --set nfs.path=/data --set storageClass.name=nfs --set storageClass.defaultClass=true -n nfs --create-namespace
  ```
  
## Deploy Aplikasi Wordpress + DB (Menggunakan PVC)
## Instalasi dan Konfigurasi MetalLB untuk Load Balancer
## Deploy Aplikasi Nginx dengan eskpos akses Load Balancer
