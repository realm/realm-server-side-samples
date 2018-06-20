# Realm Object Server Helm Chart

This directory includes a Helm chart suitable for deploying Realm Object Server in a Kubernetes Cluster.

## Introduction

"Helm helps you manage Kubernetes applications — Helm Charts helps you define, install, and upgrade even the most complex Kubernetes application." - [helm.sh](https://helm.sh)
 
Helm uses a "chart," which is simply a set of templates that define what 
Kubernetes resources should be present in order to provide the service it
defines. Typically, a simple chart will include a template for:

* ConfigMap
* Secret
* Deployment
* Service
* Ingress

These are all basic building blocks for running apps in Kubernetes, and you
should be familiar with them before proceeding.

## Getting Started

Minikube is currently not supported for local macOS deployments because they currently do not support RBAC in k8s. For local deployments please use Docker Edge with Kubernetes found here:
https://docs.docker.com/v17.09/docker-for-mac/install/

### Install Kubectl

On macOS (can be skipped if using Docker for Mac):

    brew install kubectl

Other: [Installing kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)

### Install Helm CLI

On macOS:

    brew install kubernetes-helm

Other: [Installing Helm](https://docs.helm.sh/using_helm/#installing-helm)

### Install Tiller and Kubernetes Dashboard (if using Docker for Mac as a cluster)

If you're using Docker for Mac or an otherwise new cluster, you need to install tiller in the cluster:

    helm init --upgrade --wait

You might also want to access the Kubernetes Dashboard. In order to do so, you need to install it:

    helm install --kube-context=docker-for-desktop \
                --name kubernetes-dashboard --namespace kube-system \
                stable/kubernetes-dashboard -f - <<EOL
    service:
        type: NodePort
        nodePort: 30443
    EOL

After doing so, your dashboard will be accessible at [https://127.0.0.1:30443/](https://127.0.0.1:30443/).

Or it will be accessible via the commands printed to the terminal. Copy and paste those commands and follow the http link a web browser.

## Running the chart to create a release

The Realm Object Server Helm chart includes default values that are suitable
for running ROS on any Kubernetes cluster, in a basic configuration:

    helm upgrade --install my-ros ./helm/realm-object-server

If you need to customize your installation, you can override any values from
[values.yaml](realm-object-server/values.yaml).  For example, if you're using
Docker for Mac and would like to use a custom image that you're developing
locally (see below as well), write this to a new `values.yaml` file:

    image:
      repository: realm-object-server
      tag: latest
      pullPolicy: Never

and run:

    helm upgrade --install my-ros ./helm/realm-object-server -f values.yaml

Obviously, everybody's environment is different, and charts typically allow for
customization of these resources in order to run the application effectively
regardless of cloud provider.

## Accessing ROS

When using the default values, ROS will not be exposed to the internet. Defining
ingress to your ROS is something that is typically customized according to the
cloud provider.  Here are some ways you can expose your ROS:

### Port Forward

Port forwarding is the quickest way to access a Kubernetes Pod for testing and
development.  First, find the name of the ROS Pod and start a proxy to it:

    $ kubectl get pods -l app=realm-object-server,component=core
    NAME                                          READY     STATUS        RESTARTS   AGE
    my-ros-realm-object-server-75cd8f7c88-g6d2f   1/1       Running       0          6s
    $ kubectl port-forward my-ros-realm-object-server-75cd8f7c88-g6d2f 9080:9080
    Forwarding from 127.0.0.1:9080 -> 9080

Now you can access on `http://127.0.0.1:9080` with this adminToken:

    eyJhcHBfaWQiOiJpby5yZWFsbS5hdXRoIiwiaWRlbnRpdHkiOiJfX2FkbWluIiwiYWNjZXNzIjpbImRvd25sb2FkIiwidXBsb2FkIiwibWFuYWdlIl0sInNhbHQiOiIyOGMwNDgzMCJ9:c2S8hMDUua/zfizq3AqZFOB07Adow6JOUuSucyTyvhTtVdJBN3tGjxD/7FKL9CJ77JI8DqoNB/1grR9iXZlkGXU7aiPxttA+lYtoEU9Rbo85IyKN2Yf5C28U6X8gUrI6hGeTSCm1DPCInrW8ZcBKOfTb67IY9PLlAU/9gGap4LyguvejD/TEpsLSWgTSiS/UME5IzZa4Y5YjQ1f8G5bhFSDaIIN3yrS8O8VXHbZ/qpBXdmPku6Jn7q+L7W4usvgPxLf57Te3TfM5eqAvKtD/vx+SJAiAJifPdig0Xt1Zy2ZsoV5zrG4q+GP0E4sDQ/AYP4HVeeuoMkNgi2q58jmJuQ==

### Set the ROS Service to use NodePort

If you have direct access to nodes in the cluster (such as with Docker for
Mac), you can set the ROS Service to be a
[NodePort](https://kubernetes.io/docs/concepts/services-networking/service/#type-nodeport)
service:

    service:
      type: NodePort
      # Omit the port to get kubernetes to choose one
      port: 30080

In which case you could access ROS at `http://node-ip:30080` (`http://localhost:30080` when using Docker for Mac).

### Set the ROS Service to LoadBalancer

If you are using a cloud provider that can provide
[LoadBalancer](https://kubernetes.io/docs/concepts/services-networking/service/#type-loadbalancer)
functionality on services, using the LoadBalancer service type might be suitable
for you (below is an example using AWS):

    service:
      type: LoadBalancer
      annotations:
        service.beta.kubernetes.io/aws-load-balancer-backend-protocol: "http"
        service.beta.kubernetes.io/aws-load-balancer-ssl-ports: "https"
        service.beta.kubernetes.io/aws-load-balancer-ssl-cert: "arn:aws:acm:eu-west-1:774659224473:certificate/a143cde5-dc1f-4b35-b2b0-63cad2f9322e"
        external-dns.alpha.kubernetes.io/hostname: "my-ros.arena.k8s.realmlab.net"


### Enable Ingress

If you have a Kubernetes
[Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
Controller that you would like to use, you can enable it like so (using the
nginx ingress controller in arena):

    ingress:
      enabled: true
      annotations:
        kubernetes.io/ingress.class: nginx
      path: /
      hosts:
        - ignorant-cat.arena.realmlab.net

## Configuring ROS

TODO

## Accessing Stats

The `realm-object-server` Helm chart also includes stats collection as an
option.  To enable it:

    prometheus:
      enabled: true
    grafana:
      enabled: true
      # You can also configure the service and/or ingress, just as with
      # core services:
      service:
        type: NodePort
        port: 30081

This will ensure that Prometheus is installed alongside Realm Object Server. It
will be configured to scrape ROS periodically for stats, which can be viewed in
Grafana. The Grafana installation also includes a few canned dashboards.

## Example values files

TODO: add examples of values files that will work with various cloud providers.

### Local development

If you're planning on using a local Docker installation for testing and development, you should
build the ROS docker image first:

    ./scripts/docker-build.sh


You will now have a local image named `realm-object-server`, which can be used by Kubernetes, using
[realm-object-server-local.values.yaml](realm-object-server-local.values.yaml) as a configuration:

    helm upgrade --install my-ros ./helm/realm-object-server -f ./helm/realm-object-server-local.values.yaml


