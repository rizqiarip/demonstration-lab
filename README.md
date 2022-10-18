# Demonstration Lab Documentation

  1. Gitlab & Sonarqube (10.8.60.174)
  2. Kubernetes Cluster (10.8.60.227, 10.8.60.228, 10.8.60.229, 10.8.60.230, 10.8.60.231)
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
  
## Kubernetes Cluster Installation (1 Master and 1 Worker)

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
  
  - Install Kubernetes tools (Master & Worker Node)
  
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
  
  - Setup cluster (Master Node)
  
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
  
  - Join cluster (Worker Node)
  
  ```console
  swapon -s
  sudo swapoff -a

  sudo kubeadm join --token s9k49t.do6h0xwn8xcvicuq 10.8.60.227:6443 
  --discovery-token-ca-cert-hash sha256:607f8f03d495b111de0685fc6811679cab7912f1e4f38a65c48cc734cdb944cd
  ```
  
  - Check nodes (Master Node)
  
  ```console
  kubectl get nodes
  ```
  
  - Install `helm` (Master Node)

  ```console
  sudo apt install apt-transport-https --yes
  curl https://baltocdn.com/helm/signing.asc | sudo apt-key add -
  echo "deb https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list

  sudo apt install -y helm
  ```

## Instalasi dan Konfigurasi MetalLB untuk Load Balancer
  
  - Set strictARP value to "true"
  
  ```console
  apiVersion: kubeproxy.config.k8s.io/v1alpha1
  kind: KubeProxyConfiguration
  mode: "ipvs"
  ipvs:
    strictARP: true
  ```
  
  - Install `metallb` by manifest
  
  ```console
  kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.13.7/config/manifests/metallb-native.yaml
  ```
  
  - Configure ip address pool for `metallb`
  
  ```
  apiVersion: metallb.io/v1beta1
  kind: IPAddressPool
  metadata:
    name: first-pool
    namespace: metallb-system
  spec:
    addresses:
    - 10.8.60.229-10.8.60.231
  ---
  kind: L2Advertisement
  metadata:
    name: example
    namespace: metallb-system
  spec:
  ipAddressPools:
  - first-pool
  ```
   
  - Tes deployment nginx using assigned ip loadbalancer
  
  ```console
  kubectl create deploy nginx-test --image nginx && kubectl expose deploy nginx-test --port 80 --type LoadBalancer
  kubectl delete deploy nginx-test && kubectl delete svc nginx-test
  ```
  
## Instalasi dan konfigurasi ingress controller Nginx 

  - Install Ingress Controller Nginx using helm (Master node)
  
  ```console
  helm repo add nginx-stable https://helm.nginx.com/stable
  helm repo update
  helm install ingress nginx-stable/nginx-ingress
  kubectl get svc ingress-nginx-ingress
  ```
  
  - Create deployment for testing
  
  ```console
  kubectl create deployment nginx --image nginx
  kubectl create deployment apache --image httpd
  kubectl expose deployment nginx --port 80 --type NodePort
  kubectl expose deployment apache --port 80 --type LoadBalancer
  ```
  
  - Create ingress and target the two services that have been created
  
  ```
  spec:
    ingressClassName: nginx
    rules:
      - host: nginx.arip
        http:
          paths:
            - path: /
              pathType: Prefix
              backend:
                service:
                  name: nginx
                  port:
                    number: 80
      - host: apache.arip
        http:
          paths:
            - path: /
              pathType: Prefix
              backend:
                service:
                  name: apache
                  port:
                    number: 80
  ```
  
  - Define domain in /etc/hosts
  
  ```
  10.8.60.229 nginx.arip apache.arip
  ```
  
  - Tes access to deployment
  
  ```console
  curl nginx.arip
  curl apache.arip
  ```
  
## Membuat dynamic Storageclass dengan NFS

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
  
  - Tes NFS from master to worker (Master node)
  
  ```console
  showmount -e 10.8.60.228
  sudo mount -t nfs 10.8.60.228:/data /mnt
  touch /mnt/testfrommaster
  ```
  
  - Method 1 connecting pod to `nfs-server` directly
  
  ```
  spec:
  volumes:
    - name: nfs-volume
      nfs:
        server: arip-kube-worker
        path: /data
  containers:
    - name: app
      image: alpine
      volumeMounts:
        - name: nfs-volume
          mountPath: /mnt
      command: ["/bin/sh"]
      args: ["-c", "while true; do touch /mnt/tes-method1; sleep 5; done"]
  ```
  
  - Method 2 using persistent volume claim and storageclass
  
  ```console
  helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
  helm install nfs nfs-subdir-external-provisioner/nfs-subdir-external-provisioner --create-namespace \
  --namespace nfs --set nfs.server=arip-kube-worker --set nfs.path=/data --set storageClass.defaultClass=true
  kubectl get sc
  ```
  
  - Create persistent volume claim (pvc) using nfs-client storageclass
  
  ```console
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: sc-nfs-pvc
  spec:
    accessModes:
      - ReadWriteOnce
    storageClassName: nfs-client
    resources:
      requests:
        storage: 2Gi
  ```
  
  - Create deployment nginx with NFS mount
  
  ```console
  spec:
    volumes:
      - name: nfs-vols
        persistentVolumeClaim:
          claimName: pvc-scnfs
    containers:
      - image: nginx
        name: nginx
        volumeMounts:
        - name: nfs-vols
          mountPath: /usr/share/nginx/html
  ```
      
## Deploy Aplikasi Wordpress + DB (Menggunakan PVC)

  - Create namespace & secret

  ```
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/namespace-secret.yaml
  
  ```
  
  - Create persistent volume (pv)
  
  ```
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/pv.yaml
  ```
  
  - Create persistent volume claim (pvc)
  
  ```
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/pvc.yaml
  ```
  
  - Deploy Mysql deployment
  
  ```console
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/mysql-deployment.yaml
  ```
  
  - Deploy Wordpress deployment
  
  ```console
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/wordpress-deployment.yaml
  ```
  
  - Check pod in wordpress namespace
  
  ```console
  kubectl get pod -n wordpress -w
  ```
  
  - Check directory nfs in master (/mnt/wordpress-wordpress-persistent-storage-pvc-973839eb-7c24-45b9-8be0-7beea6ead40a)
  
  ```console
  cd /mnt/wordpress-wordpress-persistent-storage-pvc-973839eb-7c24-45b9-8be0-7beea6ead40a/ && ls
  touch tesfrommaster
  ```
  
  - Check directory nfs inside pod (/var/www/html)
  
  ```console
  kubectl exec -it wordpress-55456b9bcc-9zg6n bash -n wordpress
  ls && ls frommaster
  ```
  
  - Update ingress, add host wordpress.arip with service wordpress
  - Define domain in /etc/hosts or /drivers/etc/hosts (windows)
  - Tes access wordpress from cli or web browser
  
  ```console
  curl wordpress.arip
  ```

# Jenkins & Sonarqube ce
