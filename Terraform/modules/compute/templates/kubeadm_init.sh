#!/bin/bash 
### install Kubeadm
sudo apt-get update
# apt-transport-https may be a dummy package; if so, you can skip that package
LOG_FILE="/var/log/setup.log"

if [ ! -f LOG_FILE ]; then
  sudo touch $LOG_FILE
fi

echo "Installing fetching packages and creating folders" | sudo tee -a $LOG_FILE

sudo apt-get install -y apt-transport-https ca-certificates curl gpg

## Check for path
## Reference: In releases older than Debian 12 and Ubuntu 22.04, directory /etc/apt/keyrings does not exist by default, and it should be created before the curl command.
if [ ! -d /etc/apt/keyrings ]; then
  sudo mkdir -p /etc/apt/keyrings
fi

# If the directory `/etc/apt/keyrings` does not exist, it should be created before the curl command, read the note below.
# sudo mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.36/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

# This overwrites any existing configuration in /etc/apt/sources.list.d/kubernetes.list
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.36/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list


sudo apt-get update

echo "Installing Kubernetes tools" | sudo tee -a $LOG_FILE

sudo apt-get install -y kubelet kubeadm kubectl | sudo tee -a $LOG_FILE
sudo apt-mark hold kubelet kubeadm kubectl

sudo systemctl enable --now kubelet


### Installing containerd
echo "Installing containerd" | sudo tee -a $LOG_FILE

sudo apt-get install -y containerd | sudo tee -a $LOG_FILE


### Installing Helm
sudo apt-get install curl gpg apt-transport-https --yes
curl -fsSL https://packages.buildkite.com/helm-linux/helm-debian/gpgkey | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/helm.gpg] https://packages.buildkite.com/helm-linux/helm-debian/any/ any main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm

