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
RUN npm install
 
EXPOSE 8080

CMD ["/usr/bin/supervisord"]

