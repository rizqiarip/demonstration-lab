# Demonstration Lab Documentation

  1. Gitlab (10.8.60.174)
  2. Kubernetes Cluster (10.8.60.227, 10.8.60.228)
  3. Jenkins & Sonarqube (10.8.60.227:8080, 10.8.60.227:9000)

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
  
  - Create Personal Access Token
  
  User Settings > Access Tokens > Fill Token name > Checklist the API permission (required) and checklist another permission if necessary > Create personal access token 
  
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
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: ingress-arip
    annotations:
      nginx.ingress.kubernetes.io/rewrite-target: /
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

  ```console
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/namespace-secret.yaml
  
  ```
  
  - Create persistent volume (pv)
  
  ```console
  kubectl create -f https://raw.githubusercontent.com/rizqiarip/repository-file/main/pv.yaml
  ```
  
  - Create persistent volume claim (pvc)
  
  ```console
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
  
  - Create ingress in wordpress namespace
  
  ```
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: ingress-arip
    namespace: wordpress
    annotations:
      nginx.ingress.kubernetes.io/rewrite-target: /
  spec:
    ingressClassName: nginx
    rules:
    - host: wordpress.arip
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: wordpress
                port:
                  number: 80
  ```
  
  - Define domain in /etc/hosts and /drivers/etc/hosts (windows)
  
  ```
  10.8.60.229 nginx.arip apache.arip wordpress.arip
  ```
  
  - Tes access wordpress from cli or web browser
  
  ```console
  curl wordpress.arip
  ```

# Jenkins & Sonarqube ce

## Setup and Configure Jenkins

  - Create `Jenkins` with docker 
  
  ```console
  sudo docker run -d -p 8080:8080 -p 50000:50000 --name my-jenkins --network=host jenkins/jenkins
  ```
  
  - Access `Jenkins` from browser (10.8.60.227:8080)
  
  ```
  Unlock Jenkins use administrator password from /var/jenkins_home/secrets/initialAdminPassword > Create user and Set Jenkins url > Install suggested plugins
  ```
   
  - Setup plugins Kubernetes, Gitlab, Sonarqube
  
  Dashboard > Manage Jenkins > Manage plugins > Available plugins > Search and check Kubernetes plugin, Gitlab plugin, SonarQube Scanner for Jenkins > Install without restart > Wait until process installation finish  
  
  - Restart `jenkins` before running pipeline
  
  ```console
  sudo docker stop jenkins
  sudo docker start jenkins
  or
  http://10.8.60.227:8080/safeRestart
  ```
  
## Create pod to k8s through pipeline

  - Create namespace jenkins in k8s
  
  ```console
  kubectl create namespace jenkins
  ```
  
  - Create serviceaccount jenkins
  
  ```console
  kubectl create sa jenkins -n jenkins
  ```
  
  - Create secret from file
  
  ```
  apiVersion: v1
  kind: Secret
  metadata:
    name: jenkins
    namespace: jenkins
    annotations:
      kubernetes.io/service-account.name: jenkins
  type: kubernetes.io/service-account-token
  ```
  
  - Create rolebindings for jenkins
  
  ```console
  kubectl create rolebinding jenkins-admin-binding --clusterrole=admin --serviceaccount=jenkins:jenkins --namespace=jenkins
  ```
  
  - Disable Nodes
  
  Dashboard > Manage Jenkins > Nodes > Built-In Node > Change the number of the executor to 0 > save
    
  - Get token from secret for credential `Jenkins` (authentication k8s with jenkins)
  
  ```console
  #write down token
  kubectl describe secret $(kubectl describe sa jenkins -n jenkins | grep Token | awk '{print $2}') -n jenkins
  ```
  
  - Configure Clouds
  
  Dashboard > Manage Jenkins > Configure clouds > Fill Name=Kubernetes, Kubernetes URL=https://10.8.60.227:6443, check Disable https certificate check, Kubernetes Namespace=jenkins > Add credentials, Global credentials, Kind=Secret text, Scope=Global, Secret=(from previous step), ID=jenkins, Descriptions (optional), Add > Use credentials jenkins > Test connection (Connected to Kubernetes v1.25.2) > check WebSocket > Fill Jenkins URL with http://10.8.60.227:8080 > Save
  
  - Create project

  Dashboard > New Item > Fill the project name > Choose Pipeline > Ok
  
  - Create pipeline
  
  ```
  pipeline {
  agent {
    kubernetes {
      yaml '''
        apiVersion: v1
        kind: Pod
        spec:
          containers:
          - image: rizqiarif/nodejs:alpinev1
            name: nodejs-con
        '''
    } 
  }
  stages {
    stage('Exec container') {
      steps {
        container('nodejs-con') {
          sh 'pwd'
          sh 'ls'
        }
      }
    }
  }
}
  ```
  
  - Build pipeline
  
  Dashboard > Project > Build Now > Console output > Wait until the process finish
  ![image](https://user-images.githubusercontent.com/89076954/202072058-a408982f-996f-4f90-ab64-53b8277d2762.png)

  - Access the nodejs app while the pipeline is still running
  
  ```console
  kubectl get pod -n jenkins
  kubectl expose pod nodejs-tes-36-gzp19-1dlw8-bpbfv --port 8000 --type NodePort -n jenkins
  kubectl get svc -n jenkins
  curl 10.8.60.227:30906 #port from previous command
  ```
  ![image](https://user-images.githubusercontent.com/89076954/202072224-c84276f9-9215-4b55-9584-30fab09e6168.png)

## Setup Sonarqube

  - Create `Sonarqube` with docker
  
  ```console
  sudo docker run -d --name sonarqube -p 9000:9000 sonarqube
  ```
  
  - Access `Sonarqube` from browser (10.8.60.227:9000)
  
  Fill authentication with username admin and password admin (default) > Redirect to change the default password > Setup DevOps platform integration, choose GitLab (optional) > Fill the Configuration name, GitLab API URL, and Personal Access Token > Save Configuration > Choose repository
  
  - Generate Token for credentials used
  
  My account > Security > Fill Name, choose the type, select the expires date, and Generate
  
  - Configure Sonarqube system in Jenkins
  
  Dashboard > Manage Jenkins > Configure System > SonarQube servers > Fill the name (sonarqube), Server URL (http://10.8.60.227:9000), Server authentication token (Create new credential and use secret text type and Sonarqube token for the credential)

  - Configure Sonarqube tool  in Jenkins
  
  Dashboard > Manage Jenkins > Global Tool Configuration > SonarQube Scanner > Fill the tools name > Select the latest version of SonarQube Scanner

## Create an analysis automation project (Sonarqube, Jenkins, Gitlab, Webhook)
  
  - Create and configure Pipeline job in `Jenkins`
  
  Dashboard > New Item > Fill project name Choose pipeline > Ok
  
  - Configure pipeline
  
  Under Build Triggers, choose "Build When a change is pushed to GitLab", copy the webhook URL, checklist "Push events", on Advanced Generate token and copy. 
  Under Pipeline, use definition "Pipeline script from SCM", fill the Repository URL, create new credential use "username and password" type and fill with the authentication in gitlab, fill the "branches to build" with */main, use Script Path with Jenkinsfile, Save
  
  
  - Create a Gitlab Webhook
  
  Go to the Gitlab Webhook creation, enter the Webhook URL, and the Webhook token, under Trigger, Checklist Push events, Add Webhook
  
  - Clone repository from gitlab
  
  ```console
  git clone http://gitlab-ce.arip.com/gitlab-instance-84ea568f/tes-kanban.git
  cd tes-kanban
  ```

  - Create sonar-project.properties
  
  ```
  sonar.projectKey=gitlab-instance-84ea568f_tes-kanban_AYR2zQUT3QpvnSTRn7_G
  ```

  - Create Jenkinsfile
  
  ```
  node {
  stage('SCM') {
    checkout scm
  }
  stage('SonarQube Analysis') {
    def scannerHome = tool 'Sonarqube';
    withSonarQubeEnv() {
      sh "${scannerHome}/bin/sonar-scanner"
    }
  }
}
  ```

  - Create condition in Sonarqube
  
  Dashboard Sonarqube > Quality Gates > Create > Add Condition > Bugs with value 1 > Choose permissions > and Projects (tes-kanban)
  
  note: Quality Gates will fails when bugs is more than 1

### Create file for example app (source https://medium.com/code-to-express/sonarqube-static-code-analysis)
  
  - index.html
  
  ```
  <!DOCTYPE html>
  <html>
      <head>
  <title>sosnar lint demo</title>
  <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet/less" type="text/css" href="./style.less" />
  </head>
  <body>
      <div>
        <h1 id="demo"></h1>
        <h2>This is a H2 tag.</h2>
        <small>LESS Variables documentation: <a href="#" title="LESS Variables documentation">http://lesscss.org/#-variables</a></small>
      </div>
      <input type="text" name="firstname" />
      <b>Demo By Nikhil</b>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/less.js/3.9.0/less.min.js" ></script>
      <script src="./app.js"></script>
  </body>
  </html>
  ```

  - style.less
  
  ```
  @nice-blue: #5B83AD;

  #header { 
    color: @nice-blue; 
    margin: 2em;
  }
  #header { 
      color:#000; 
      margin: 2em;
    }

  a {
      font-family: 'Georgia', Georgia, serif; /* Noncompliant; 'Georgia' is duplicated */
    }
  ```

  - app.js
  
  ```
  var firstname = "nikhil1"

  var lastname = "karkra"
  var firstname = "nikhil"
  document.getElementById('demo').innerHTML = `Hey i am ${firstname} ${lastname}, My name coming from Javascript`

  var a = NaN;

  if (a === NaN) {  // Noncompliant; always false
    console.log("a is not a number");  // this is dead code
  }
  ```

  - Push to repository
  
  ```console
  git add .
  git commit -m "add file file to repo"
  git push #fill password with gitlab personal access token
  ```

### Console output recent build on Jenkins
  
  ![image](https://user-images.githubusercontent.com/89076954/202255373-9b5a9359-39ac-4c04-8e5a-b665fddf6a93.png)

### SonarQube Quality Gate status after run pipeline
  
  ![image](https://user-images.githubusercontent.com/89076954/202260816-dae0ba9e-11fb-4cfd-8db3-23eac1bc04c2.png)

### Sonarqube report
  
  ![image](https://user-images.githubusercontent.com/89076954/202260984-346b45b8-9fa6-40d9-bd08-5dc877678e3f.png)

  - Push to repository Gitlab
  
  ```console
  
  ```

  - Push to repository Gitlab
  
  ```console
  
  ```

  - Push to repository Gitlab
  
  ```console
  
  ```

  - Push to repository Gitlab
  
  ```console
  
  ```
