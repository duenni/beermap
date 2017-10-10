#!/bin/bash

# Wiki beermap stat generator
# Run this file in crontab to generate up to date statfiles country.json & style.json in OUTDIR

WGET="/usr/bin/wget -qO-"
WIKI_PREFIX="http://www.massafaka.at/massawiki/doku.php?id=bierstats"
WIKI_COUNTRY_URL="${WIKI_PREFIX}:herkunft"
WIKI_STYLE_URL="${WIKI_PREFIX}:sorten"
WIKI_OVERVIEW_URL="${WIKI_PREFIX}:uebersicht"

CONTENT_PATTERN="<td class=\"inline\""

OUTDIR="$HOME/html/beermap/js"
FLAG=false

country_beer_counter=0

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


for i in $(grep anzahl ${OUTDIR}/country.json|cut -d'"' -f4); do let country_beer_counter+=$i; done
overall_counter=$(${WGET} ${WIKI_OVERVIEW_URL} | grep count overview.out | cut -d'>' -f2 | cut -d'<' -f1)
if [ ${overall_counter} -ne ${country_beer_counter} ]
then
	echo "ERROR: Anzahl Gesamtbiere stimmt nicht mit der \"Herkunfts-Summe\" überein"
	echo "Anzahl Gesamtbiere       : ${overall_counter}"
	echo "Anzahl \"Herkunfts-Summe\" : ${country_beer_counter}"
fi >&2