FROM ubuntu:utopic

# Setup NodeSource Official PPA
RUN apt-get update && \
    apt-get install -y --force-yes \
    curl \
    apt-transport-https \
    lsb-release \
    build-essential \
    python-all 
RUN curl -sL https://deb.nodesource.com/setup | bash -

RUN apt-get install nodejs -y --force-yes
RUN npm install -g node-gyp \
    && npm cache clear

#canvas 
RUN apt-get install -y --force-yes libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++ libpng-dev

#mongo
RUN apt-get install -y --force-yes mongodb
RUN mkdir -p /data/db


#supervisor
RUN apt-get install -y --force-yes supervisor
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

ADD . /srv
WORKDIR /srv
# install the dependencies
RUN npm install canvas
RUN npm install
 
EXPOSE 8080

CMD ["/usr/bin/supervisord"]

