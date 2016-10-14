# Zoning
This simple app gets 1) a csv file of names and addresses, and 2) a number n between 1 to 13, and distribute addresses to n zones based on proximity. Once the zoning is complete, you can still manually change zones assigned to addresses on the map by clicking on markers and moving it to the new zone. Then you can generate a new csv file, which is the same as the input csv file, with zone numbers added in the last column.

## How to use it
### When input file needs zoning to be done by the app
The input file must be a csv file. The first row is considered as the header and will be ignored. 
In particular, the first row must be the same as the following 

* firstname,lastname,address,email,telephone,comment

Next,

1. Select the file,
2. Enter the total number of zones you want the addresses to be distributed to. The maximum number of zones is 13,
3. Press run and wait for the addresses to appear in the map,
4. If you want to move an address to another zone, click on its marker, enter the new zone, and press "move to zone",
5. Once you are ok with the displayed zoning, press "create download link" and then press "download",

Click [here](https://github.com/seyeda/zoning/blob/master/sampleFileNeedZoning.csv) to see a sample file.

### When input file does not needs zoning to be done by the app
The input file must be a csv file. The first row is considered as the header and will be ignored. 
In particular, the first row must be the same as the following 

* firstname,lastname,address,email,telephone,comment,zone

The last attribute should be the zone number attribute.

1. Select the file,
2. Press run and wait for the addresses to appear in the map,
3. If you want to move an address to another zone, click on its marker, enter the new zone, and press "move to zone",
4. Once you are ok with the displayed zoning, press "create download link" and then press "download",

Click [here](https://github.com/seyeda/zoning/blob/master/sampleFileNotNeedZoning.csv) to see a sample file.
