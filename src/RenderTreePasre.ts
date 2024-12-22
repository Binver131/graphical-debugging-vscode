import * as debug from './debugger';


export class EChatData {
    private properties: { [key: string]: any } = {};
    private type: string;

    constructor() {
        this.type = "UNKNOWN";
    }

    public addProperty(key: string, value: any): EChatData {
        this.properties[key] = value;
        return this;
    }

    public static empty(): EChatData {
        return new EChatData();
    }

    public toData(): any {
        return {
            name: this.type,    // 节点的名称，当前节点 label 对应的文本
            label: {
                show: true,
                formatter: [
                    '{title|{b}}{abg|}',
                    '  {weatherHead|Weather}{valueHead|Days}{rateHead|Percent}',
                    '{hr|}',
                    '  {Sunny|}{value|202}{rate|55.3%}',
                    '  {Cloudy|}{value|142}{rate|38.9%}',
                    '  {Showers|}{value|21}{rate|5.8%}'
                ].join('\n'),
            },
            itemStyle: {
            }
        }
    }
}


export class EChatNode{
    toEChat(): EChatData{
        return EChatData.empty();
    }
};


export class Component implements EChatNode{
    constructor(
        public readonly name: string,
        public readonly children: EChatNode[] = []) {

        }

    toEChat(): EChatData {
        return EChatData.empty();
    }
}
