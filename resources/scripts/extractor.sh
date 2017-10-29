#!/bin/bash

# Wiki beermap stat generator
# Run this file in crontab to generate up to date statfiles in OUTDIR and monitor for deleted objects

WGET="/usr/bin/wget -qO-"
WIKI_PREFIX="http://www.massafaka.at/massawiki/doku.php?id=bierstats"
WIKI_COUNTRY_URL="${WIKI_PREFIX}:herkunft"
WIKI_STYLE_URL="${WIKI_PREFIX}:sorten"
WIKI_OVERVIEW_URL="${WIKI_PREFIX}:uebersicht"

CONTENT_PATTERN="<td class=\"inline\""

OUTDIR="$HOME/html/beermap/resources/data/"
if [[ "${1}" = "-dir" ]] && [[ -n "${2}" ]]; then
	if ls -ld ${2} >/dev/null 2>&1; then
		OUTDIR=${2}
	else
		echo "Das angegebene Verzeichnis < ${2} > existiert nicht oder ist nicht lesbar. Nutze daher aktuelles Verzeichnis"
	fi
fi

FLAG=false
MAIL_FLAG=true

country_beer_counter=0

last_stat_file="${OUTDIR}/$(date +%Y -d yesterday)-stats.json"
act_stat_file="${OUTDIR}/$(date +%Y)-stats.json"
monthly_stat_file="${OUTDIR}/$(date +%Y -d yesterday)-monthly-stats.json"

yesterday="$(date +%Y-%m-%d -d yesterday)"
today="$(date +%Y-%m-%d)"
last_month="$(date +%Y-%m -d yesterday)"

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

create_json_stats_file ()
{
	cat > ${1} <<-EOF
	stats = [
	  {
	    "date":"${2}","count":"${3}"
	  }
	]
	EOF
}

update_json_stats_file ()
{
	if [ ! -f ${1} ]; then
		create_json_stats_file ${1} ${2} ${3}
	else
		if  grep "${2}" ${1} >/dev/null 2>&1; then
			sed  -i -e "s#\(.*${2}.*:\).*#\1\"${3}\"#g" ${1}
			MAIL_FLAG=false
		else
			sed -i -e "s#  }\$#  },#" -e "/]/d" ${1}
			cat >> ${1} <<-EOF
			  {
			    "date":"${2}","count":"${3}"
			  }
			]
			EOF
		fi	
	fi
}

# Create/UPADET stat files
generate_json country ${WIKI_COUNTRY_URL}
generate_json style ${WIKI_STYLE_URL}

# Check for alarms and create/UPADET monthly stat file on first day of month
for i in $(grep anzahl ${OUTDIR}/country.json|cut -d'"' -f4); do let country_beer_counter+=${i}; done
overall_counter=$(${WGET} ${WIKI_OVERVIEW_URL} | grep count | cut -d'>' -f2 | cut -d'<' -f1)
if [ ${overall_counter} -ne ${country_beer_counter} ]
then
	echo "ERROR: Anzahl Gesamtbiere stimmt nicht mit der \"Herkunfts-Summe\" überein"
	echo "Anzahl Gesamtbiere       : ${overall_counter}"
	echo "Anzahl \"Herkunfts-Summe\" : ${country_beer_counter}"
fi >&2

update_json_stats_file ${act_stat_file} ${today} ${overall_counter}

if [ -f ${last_stat_file} ]; then
	yesterday_counter=$(grep ${yesterday} ${last_stat_file} | cut -d'"' -f8)
        [[ -z ${yesterday_counter} ]] && exit
	if [ ${overall_counter} -lt ${yesterday_counter} ] && ${MAIL_FLAG}; then
		echo "SKANDAL, da hat jemand Bier(e) gelöscht"
		echo "Anzahl gestern : ${yesterday_counter}"
		echo "Anzahl heute   : ${overall_counter}"
	fi >&2
	
	[[ $(date +%d) -eq 1 ]] && update_json_stats_file ${monthly_stat_file} ${last_month} ${yesterday_counter}
fi