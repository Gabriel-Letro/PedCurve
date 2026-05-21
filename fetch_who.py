import urllib.request
import json
import csv

urls = {
    'bmi_boys': 'https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/bmi-for-age-(5-19-years)/bmi_boys_perc_who2007_exp.txt',
    'bmi_girls': 'https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/bmi-for-age-(5-19-years)/bmi_girls_perc_who2007_exp.txt',
    'hfa_boys': 'https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/height-for-age-(5-19-years)/hfa_boys_perc_who2007_exp.txt',
    'hfa_girls': 'https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/height-for-age-(5-19-years)/hfa_girls_perc_who2007_exp.txt',
    'wfa_boys': 'https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/weight-for-age-(5-10-years)/wfa_boys_perc_who2007_exp.txt',
    'wfa_girls': 'https://cdn.who.int/media/docs/default-source/child-growth/growth-reference-5-19-years/weight-for-age-(5-10-years)/wfa_girls_perc_who2007_exp.txt'
}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            lines = response.read().decode('utf-8').splitlines()
            
            # First line is header
            headers = lines[0].strip().split('\t')
            data = []
            for line in lines[1:]:
                row = line.strip().split('\t')
                if len(row) == len(headers):
                    data.append(dict(zip(headers, row)))
            
            with open(f'src/data/{name}_5_19.json', 'w') as f:
                json.dump(data, f, indent=4)
        print(f"Downloaded {name}")
    except Exception as e:
        print(f"Failed {name}: {e}")
