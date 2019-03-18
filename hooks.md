post-receive

````
#!/bin/bash
path="/path/to/documentroot"

echo "========= GIT CHECKOUT ========="
GIT_WORK_TREE=$path git checkout -f master
#apikey.js is in .gitignore so we manually copy it to the DocumentRoot after a push
git show HEAD:resources/js/apikey.example.js > $path/resources/js/apikey.js
#replace MAPBOXACCESSTOKENHERE with <realaccesstoken> in apikey.js
sed -i 's/MAPBOXACCESSTOKENHERE/<realaccesstoken>/g' $path/resources/js/apikey.js
#version.js is also in .gitignore
git show HEAD:resources/js/version.example.js > $path/resources/js/version.js
#show commit hash and replace COMMITHASHHERE in version.js
sed -i 's/COMMITHASHHERE/${git rev-parse --short HEAD}/g' $path/resources/js/version.js
#show current branch and replace BRANCHNAMEHERE in version.js
sed -i 's/BRANCHNAMEHERE/${git rev-parse --abbrev-ref HEAD}/g' $path/resources/js/version.js
echo "============= DONE ============="

````