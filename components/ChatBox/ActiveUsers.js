import axios from 'axios';
import Pusher from 'pusher-js';
import Game from '../game.js';

class ActiveUsers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            helped: false,
            gameLink: false,
            self: {},
            playerOne: {},
            playerOneChannel: '',
            playerTwo: {},
            playerTwoChannel: '',
            gameChannel: ''
        }

        this.pusher = new Pusher(process.env.PUSHER_APP_KEY, {
            cluster: process.env.PUSHER_APP_CLUSTER,
            authEndpoint: "/pusher/auth",
            forceTLS: true,
            auth: {
                params: {
                    username: this.props.userName,
                    color: this.props.userColor
                }
            }
        });


        
        this.onlineChannel = this.pusher.subscribe("presence-online-channel");
        this.helperFunction = this.helperFunction.bind(this);
        this.inviteFunction = this.inviteFunction.bind(this);
        

        
    }

    componentDidMount() {
        this.onlineChannel.bind('pusher:subscription_succeeded', (members) => { 
            let me = this.onlineChannel.members.me;
            let users = this.state.users;

            for (let member of Object.getOwnPropertyNames(members['members'])) {
                //alert(members['members'][member]['name']);
                users.push({
                    id: member,
                    user: members['members'][member]['name'],
                    color: members['members'][member]['color']
                });
            };


            let userIds = [];

            //alert(JSON.stringify(members['members']));
            //update users
            

            let userToBeAdded = {
                id: me.id,
                user: me.info.name,
                color: me.info.color};

            for (let i=0; i<users.length; i++) {
                userIds.push(users[i]['id']);
            }

            //alert(userIds);

            
            let found = userIds.find((userId) => {
                return userId == userToBeAdded['id'];
            });

            if (found) {
                this.setState({ users: users });
            } else if (!found) {
                return null;
            }
        });
        this.onlineChannel.bind('pusher:subscription_error', (data) => {
            alert("error\n"+data);
        });

        this.onlineChannel.bind('pusher:member_added', (user) => {
            let users = this.state.users;

            let userToBeAdded = {
                id: user.id,
                user: user.info.name,
                color: user.info.color
            };
            
            users.push(userToBeAdded);

            this.setState({users: users}); 
        });
        this.onlineChannel.bind('pusher:member_removed', (user) => {
            let users = this.state.users;

            let userIds = [];
            let userToBeRemoved = {
                id: user.id,
                user: user.info.name,
                color: user.info.color
            };
            for (let i=0; i<users.length; i++) {
                userIds.push(users[i]['id']);
            };

            let indexToRemove = userIds.findIndex((id) => {
                return id==userToBeRemoved['id'];
            });
            if(indexToRemove>-1) {
            users.splice(indexToRemove, 1);
            this.setState({users: users}); 
            };
        });

        
    }
    componentWillUnmount() {
        this.pusher.disconnect();
    }


    helperFunction() {
        if(this.state.helped == false){
            this.privateChannel = this.pusher.subscribe(`private-${this.onlineChannel.members.me.id}`);
        
        
            this.privateChannel.bind('pusher:subscription_succeeded', (members) => {
               // alert("ok");
            });
            this.privateChannel.bind('pusher:subscription_error', (error) => {
                alert(`error\n${error}`);
            });

            this.privateChannel.bind('game_started', (response) => {
                //alert(JSON.stringify(response.channels.game))
                let self = {
                    id: this.onlineChannel.members.me.id,
                    name: this.onlineChannel.members.me.info.name,
                    color: this.onlineChannel.members.me.info.color
                };
                this.setState({ 
                    gameLink: true,
                    playerOne: response.playerOne,
                    playerOneChannel: response.channels.pOne,
                    playerTwo: response.playerTwo,
                    playerTwoChannel: response.channels.pTwo,
                    gameChannel: response.channels.game,
                    self: self
                });
            });

            this.setState({ helped: true });
        }
    }

    inviteFunction(data) {
       

        let target = {
            id: data.currentTarget.dataset.userid,
            name: data.currentTarget.dataset.username,
            color: data.currentTarget.dataset.usercolor
        };

        let self = {
            id: this.onlineChannel.members.me.id,
            name: this.onlineChannel.members.me.info.name,
            color: this.onlineChannel.members.me.info.color
        };


        axios.post('/game_daemon', { playerOne: self, playerTwo: target });


    }


    render () {

        let users = this.state.users;
        let gameLink = this.state.gameLink;

        let tempArray = [];
        for (let i=0; i<=users.length; i++) {
            tempArray.push(i);
        };
        let useritr = tempArray.values();
        let nameitr = tempArray.values();
        let iditr = tempArray.values();
        let coloritr = tempArray.values();

        if(users[0]) {
            this.helperFunction();


        

            return (<div>
                <div>
                    {!!gameLink && <Game self={{username: this.state.self.name, color: this.state.self.color}} players={[{username: this.state.playerOne.name, color: this.state.playerOne.color}, {username: this.state.playerTwo.name, color: this.state.playerTwo.color}]} playerOneChannel={this.state.playerOneChannel} playerTwoChannel={this.state.playerTwoChannel} gameChannel={this.state.gameChannel} boardSize={[{x: 4}, {y: 4}]}/>}
                </div>
                
                <div>
                    {users.map((user) => <div><a href="#" onClick={this.inviteFunction} data-userid={users[iditr.next().value]['id']} data-username={users[nameitr.next().value]['user']} data-usercolor={users[coloritr.next().value]['color']}><u>
                        <User user={users[useritr.next().value]['user']} />
                        </u></a></div>)}
                </div>
            </div>);


        } else {
            return null;
        }

    }
};

class User extends React.Component {
    

    render () {
        return (<div>
           {this.props.user}
        </div>);
    };
};



export default ActiveUsers;