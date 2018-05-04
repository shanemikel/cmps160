#!/bin/bash

USER=smpearlm
HOST=unix.ucsc.edu

PASS=ucsc.edu/smpearlm/blue

workdir=$(cd "$(dirname "$0")"; pwd)
dist="$(basename "$workdir").tar.gz"
webdir='public_html'

/usr/bin/expect <(cat <<HERE
spawn scp "$dist" "$USER@$HOST:~/$webdir"
expect "?assword:"
send -- "$(pass $PASS)\n"
expect "$dist*100%"
HERE
)

/usr/bin/expect <(cat <<HERE
spawn ssh $USER@$HOST
expect "?assword:"
send -- "$(pass $PASS)\n"
expect "?ast login:"
send "cd \"$webdir\"\n"
expect "*$webdir"
expect "*$webdir"
send "tar --overwrite -xvf \"$dist\"\n"
expect "*$webdir"
HERE
)
echo
