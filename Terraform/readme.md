## From Kubeadm docs

### These required ports need to be open in order for Kubernetes components to communicate with each other. You can use tools like netcat to check if a port is open. For example:

nc 127.0.0.1 6443 -zv -w 2

### Swap configuration 
The default behavior of a kubelet is to fail to start if swap memory is detected on a node. This means that swap should either be disabled or tolerated by kubelet.

To tolerate swap, add failSwapOn: false to kubelet configuration or as a command line argument. Note: even if failSwapOn: false is provided, workloads wouldn't have swap access by default. This can be changed by setting a swapBehavior, again in the kubelet configuration file. To use swap, set a swapBehavior other than the default NoSwap setting. See Swap memory management for more details.
To disable swap, sudo swapoff -a can be used to disable swapping temporarily. To make this change persistent across reboots, make sure swap is disabled in config files like /etc/fstab, systemd.swap, depending how it was configured on your system.