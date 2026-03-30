pipeline {
    agent any

    environment {
        IMAGE_NAME = "shibilbasithcp/noteapp"
    }

    stages {

        stage('Clone Repo') {
            steps {
                git 'https://github.com/Shibil-Basith/note-app.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:latest .'
            }
        }

        stage('Login to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USER',
                    passwordVariable: 'PASS'
                )]) {
                    sh '''
                    echo $PASS | docker login -u $USER --password-stdin
                    '''
                }
            }
        }

        stage('Push Image') {
            steps {
                sh 'docker push $IMAGE_NAME:latest'
            }
        }

        stage('Deploy (ASG Refresh)') {
            steps {
                sh '''
                aws autoscaling start-instance-refresh \
                  --auto-scaling-group-name noteapp-asg
                '''
            }
        }
    }
}
