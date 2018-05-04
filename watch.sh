#!/bin/bash

declare -a files

while getopts ':f:' opt; do
    case $opt in
        f ) files[${#files[@]}]=$OPTARG
            ;;
        \?) echo 'Usage: watch.sh [-f file] cmd' >&2
            exit 1
            ;;
    esac
done
shift $((OPTIND-1))

inotify_cmd=(inotifywait -m -e modify)
for file in ${files[@]}; do
    inotify_cmd[${#inotify_cmd[@]}]=$file
done

if [ ${#files[@]} -eq 0 ]; then
    inotify_cmd[${#inotify_cmd[@]}]=-m
    inotify_cmd[${#inotify_cmd[@]}]=$1
    shift
fi

cmd=("$@")

echo "watch.sh: Watching for modified files: ${files[*]}"
echo "          On-change command hook: ${cmd[*]}"

i=0
${inotify_cmd[@]} | while read path action file; do
    printf "watch.sh: Running command (%03d): ${cmd[*]}" $i
    echo
    ${cmd[@]}
    ((i++))
done
