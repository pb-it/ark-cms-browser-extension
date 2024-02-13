#!/bin/bash

dir='web-ext-artifacts'
if [[ ! -d $dir ]]; then
    mkdir $dir
fi
zip -r -FS $dir/ark-cms-broweser-ext.zip * --exclude '*.svn*' -x '.vscode' -x '_*'