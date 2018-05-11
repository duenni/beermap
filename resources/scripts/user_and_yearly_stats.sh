#!/bin/bash

echo "START: $(date +"%d.%m.%Y - %H:%M:%S")"

# Wiki user & year stat generator

#export http_proxy=http://139.7.95.77:8080/

# TOOLS & FILES
WGET="wget -qO- --no-check-certificate"
WIKI_PREFIX="http://www.massafaka.at"
WIKI_OVERVIEW_URL="${WIKI_PREFIX}/massawiki/doku.php?id=bierstats:uebersicht"
WIKI_ORIGIN_URL="${WIKI_PREFIX}/massawiki/doku.php?id=bierstats:herkunft"

USER_FILTER="proximo|aerisch|crumb"

## STRING PATTERNS
OVERVIEW_STARTING_POINT="pagequery border"
OVERVIEW_BEER_ENTRY_LINE="<li class"
OVERVIEW_PATTERN_LIST="${OVERVIEW_STARTING_POINT}|${OVERVIEW_BEER_ENTRY_LINE}"
ORIGIN_PATTERN="<td class=\"inline\"><"

DETAIL_COMMENT_PATTERN="<em><a href="

# FLAGS
OVERVIEW_BEER_START_FOUND="FALSE"
FLAG=false

# COUNTERS
overall_beer_counter=0
max_beer_counter=10000
#max_beer_counter=10

OUTDIR="$HOME/html/beermap/resources/data/"
if [[ "${1}" = "-dir" ]] && [[ -n "${2}" ]]; then
	if ls -ld ${2} >/dev/null 2>&1; then
		OUTDIR=${2}
	else
		echo "Das angegebene Verzeichnis < ${2} > existiert nicht oder ist nicht lesbar. Nutze daher aktuelles Verzeichnis"
	fi
fi

function getIndex
{
        counter=1
        for user in ${OVERALL_USER_LIST}; do
                [[ "${user}" == "${1}" ]] && echo ${counter} && return 0
                counter=$(( ${counter} + 1 ))
        done
        OVERALL_USER_LIST="${OVERALL_USER_LIST} ${1}"
        echo ${counter}
        return 0
}

# reading overall page
${WGET} "${WIKI_OVERVIEW_URL}" | grep -E "${OVERVIEW_PATTERN_LIST}" | {
while read OVERVIEW_LINE; do
   
   	[[ -n "$(echo "${OVERVIEW_LINE}" | grep "${OVERVIEW_STARTING_POINT}")" ]] && OVERVIEW_BEER_START_FOUND="TRUE" && continue
	[[ "${OVERVIEW_BEER_START_FOUND}" != "TRUE" ]] && continue
	[[ -n "$(echo "${OVERVIEW_LINE}" | grep "list-inline")" ]] && continue

	let overall_beer_counter++

	BEER_SUB_URL="$(echo ${OVERVIEW_LINE} | cut -d'"' -f6)"
	BEER_NAME="$(echo ${OVERVIEW_LINE} | cut -d'>' -f4 | cut -d'<' -f1)"	
	
	[[ "${BEER_SUB_URL}" == "wikilink1" ]] && BEER_SUB_URL="$(echo ${OVERVIEW_LINE} | cut -d'"' -f4)"
	
	[[ -z "${BEER_SUB_URL}" ]] &&  break

	BEER_LINK="${WIKI_PREFIX}${BEER_SUB_URL}"
	
	# loop over beer detail page (filter for comment lines only
	
	FOUND_USERS_LIST=""
	FIRST_HIT=true
#	echo "* $BEER_NAME"	
#	echo "$BEER_LINK"
	for curr_user_date in $(${WGET} ${BEER_LINK} | grep -E "${DETAIL_COMMENT_PATTERN}" | sed 's#.*id=bier:\([0-9a-z_]*\)".*\a> *\([0-9]*\)/.*#\1|\2#' | sed 's# #_#g'); do

		curr_user=$(echo ${curr_user_date} | cut -d'|' -f1)
		curr_date=$(echo ${curr_user_date} | cut -d'|' -f2)
			
		[[ -n "$(echo "${FOUND_USERS_LIST}" | grep "${curr_user}")" ]] && continue

		if [ -z "${curr_user}" ]
		then
			echo "ERROR: No username found!"
			echo "* $BEER_NAME"	
			echo "$BEER_LINK"
		fi
		
#		echo "${curr_user}"
		
		getIndex "${curr_user}" > /dev/null
		let overall_comment_list[$(getIndex "${curr_user}")]++
		
		FOUND_USERS_LIST="${FOUND_USERS_LIST} $curr_user"

		if ${FIRST_HIT}
		then
			# consider first comment's year for yearly statistic
			first_comment_list[${overall_beer_counter}]="${curr_date}"
			FIRST_HIT=false
		fi
	
	done
	
	[[ ${max_beer_counter} -eq ${overall_beer_counter} ]] &&  break
			
done

#generate_json user
OUTFILE=${OUTDIR}/user.json
echo "user = [" > ${OUTFILE}
for user in ${OVERALL_USER_LIST}; do
	[[ -n "$(echo "${user}" | grep -E "${USER_FILTER}")" ]] && continue
	[[ -z "${overall_comment_list[$(getIndex "${user}")]}" ]] && overall_comment_list[$(getIndex "${user}")]=0
    echo "${user} ${overall_comment_list[$(getIndex "${user}")]}"
done | sort -r -n -t' ' -k2 | while read user num; do
	if ${FLAG}
	then
		printf ",\n"
	else
		FLAG=true
	fi	
	printf "  {\n    \"name\":\"${user}\",\n"
	printf "    \"anzahl\":\"${num}\"\n  }"
			
done >> ${OUTFILE}
printf "\n]" >> ${OUTFILE}

#generate_json year 
OUTFILE=${OUTDIR}/year.json
echo "year = [" > ${OUTFILE}
for cdate in "${first_comment_list[@]}"; do
        echo ${cdate} 
done  | sort | uniq -c | while read num year; do
	if ${FLAG}
	then
		printf ",\n"
	else
		FLAG=true
	fi	
	printf "  {\n    \"jahr\":\"${year}\",\n"
	printf "    \"anzahl\":\"${num}\"\n  }"
			
done >> ${OUTFILE}
printf "\n]" >> ${OUTFILE}

}

echo "STOP:  $(date +"%d.%m.%Y - %H:%M:%S")"
