#!/bin/bash

# Wiki beermap stat generator
# Run this file in crontab to generate up to date statfiles country.json & style.json in OUTDIR

WGET="/usr/bin/wget -qO-"
WIKI_PREFIX="http://www.massafaka.at/massawiki"
WIKI_COUNTRY_URL="${WIKI_PREFIX}/doku.php?id=bierstats:herkunft"
WIKI_STYLE_URL="${WIKI_PREFIX}/doku.php?id=bierstats:sorten"
CONTENT_PATTERN="<td class=\"inline\""

OUTDIR="$HOME/html/beermap/js/"
FLAG=false

generate_json ()
{
    OUTFILE=${OUTDIR}/${1}.json
    echo "${1} = [" > ${OUTFILE}
    ${WGET} ${2} | grep "${CONTENT_PATTERN}"  | while read LINE;
    do
        name="$(echo ${LINE} | grep bier | sed 's#.*rel="tag">\([-a-z_ ]*\)<.*#\1#')"
        if [ -n "${name}" ]
        then
            if ${FLAG}
            then
                printf ",\n"
            else
                FLAG=true
            fi	
            printf "  {\n    \"name\":\"${name}\",\n"
            tag="$(echo ${name} | tr ' ' '_')"
        else
            printf "    \"anzahl\":\"$(echo "${LINE}" | sed 's#.*>\([0-9]*\)<.*#\1#')\",\n"
            printf "    \"href\":\"http://www.massafaka.at/massawiki/doku.php?id=bier:${tag}&do=showtag&tag=${tag}\"\n  }"
        fi
    done >> ${OUTFILE}
    printf "\n]" >> ${OUTFILE}
}


generate_json country ${WIKI_COUNTRY_URL}
generate_json style ${WIKI_STYLE_URL}
